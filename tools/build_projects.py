#!/usr/bin/env python3
"""Build a static page for every research project: projects/<slug>/index.html.

The pages are plain HTML (no JSON loaded in the browser), so search engines and language models read them in full.
Data:
  data/projects-info.json   the projects: text, methods, outcomes, timeline, tags, and the curated lists
                            "papers" (folders in publications/), "team", "videos", "media" and "tools"
  data/lab.json             photo, title, dates and current/alumni status of every lab member named in "team"
  publications/*/paper.json title, authors, journal, year, summary and featured figure of each paper
  data/videos.json, data/media.json, data/tools.json

It also writes the project list on projects.html, the project pages in sitemap.xml and llms.txt, and a social
image (share.jpg) per project. Run it after build_papers.py whenever the data changes:

    python tools/build_projects.py
"""
import collections
import datetime as dt
import json
import re
import sys
from pathlib import Path
from string import Template

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_papers import ROOT, SITE, IMAGE_NS, read_json, norm, esc, clip, replace_block  # noqa: E402
from PIL import Image  # noqa: E402

TEMPLATE = ROOT / 'tools' / 'templates' / 'project.html'
MARK_START, MARK_END = 'project pages: start (made by tools/build_projects.py)', 'project pages: end'
LIST_START, LIST_END = 'project list: start (made by tools/build_projects.py)', 'project list: end'
MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split()
TITLE_RE = re.compile(r'^(Prof\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s+')
RANKS = [('pi', 0), ('post', 1), ('lab manager', 1), ('phd', 2), ('msc', 3), ('master', 3), ('bsc', 4), ('bachelor', 4), ('research assistant', 5)]
METHOD_RE = re.compile(r'^(We (used|tested|studied|built|collected|analy[sz]ed|developed|applied|compared|ran|surveyed|recorded)|Data (came|were|was)|Using |The (data|dataset|study) )', re.I)
ICONS = [('scholar.google', 'ri-graduation-cap-line', 'Google Scholar'), ('linkedin', 'ri-linkedin-box-line', 'LinkedIn'),
         ('github', 'ri-github-line', 'GitHub'), ('researchgate', 'ri-book-open-line', 'ResearchGate')]


# ---------------------------------------------------------------- small helpers
def plain_name(name):
    return TITLE_RE.sub('', (name or '').strip())


def name_keys(name):
    """Two ways to recognise a person across sources: the whole name, and first + last name
    ('Brittany N. Florkiewicz' = 'Brittany Florkiewicz', 'Amit Yaniv-Rosenfeld' = 'Amit Yaniv Rosenfeld')."""
    name = plain_name(name)
    parts = [p for p in re.split(r'\s+', name) if p]
    keys = {norm(name)}
    if len(parts) >= 2:
        keys.add(norm(parts[0]) + '|' + norm(parts[-1]))
    return keys


def same_person(a, b):
    return bool(name_keys(a) & name_keys(b))


def month(text):
    """'03/2024', '1/10/2023' (day/month/year) or '2026' -> (year, month)."""
    nums = [int(x) for x in re.findall(r'\d+', text or '')]
    if not nums:
        return None
    if len(nums) == 1:
        return (nums[0], None)
    if len(nums) == 2:
        return (nums[1], nums[0])
    return (nums[2], nums[1])


def fmt_month(ym):
    if not ym:
        return ''
    y, m = ym
    return f'{MONTHS[m - 1]} {y}' if m and 1 <= m <= 12 else str(y)


def period_parts(period):
    bits = re.split(r'\s*[-–—]\s*', period or '')
    start = month(bits[0]) if bits and bits[0] else None
    end = month(bits[1]) if len(bits) > 1 and bits[1] else None
    return start, end


def fmt_period(period):
    start, end = period_parts(period)
    if start and end:
        return f'{fmt_month(start)} – {fmt_month(end)}'
    return fmt_month(start) or (period or '')


def iso_month(ym):
    if not ym:
        return None
    y, m = ym
    return f'{y}-{m:02d}' if m else str(y)


def plural(n, word, many=None):
    return f'{n} {word if n == 1 else (many or word + "s")}'


def link_icon(url):
    for key, icon, label in ICONS:
        if key in url:
            return icon, label
    return 'ri-global-line', 'Website'


def image_size(path):
    try:
        with Image.open(ROOT / path) as im:
            return im.size
    except (OSError, ValueError):
        return None


def sized(path):
    wh = image_size(path)
    return f' width="{wh[0]}" height="{wh[1]}"' if wh else ''


def share_image(project, out_dir):
    """A 1200x630 JPEG (the size social sites expect) cut from the project image."""
    src = ROOT / (project.get('heroImage') or project.get('image') or 'img/logo.png')
    dst = out_dir / 'share.jpg'
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return 'share.jpg'
    im = Image.open(src).convert('RGB')
    w, h = im.size
    if w / h >= 1200 / 630:                     # wide enough: crop the sides
        nw = int(h * 1200 / 630)
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        im = im.resize((1200, 630), Image.LANCZOS)
    else:                                       # tall or small: fit it on a white canvas
        canvas = Image.new('RGB', (1200, 630), 'white')
        im.thumbnail((1200, 630), Image.LANCZOS)
        canvas.paste(im, ((1200 - im.width) // 2, (630 - im.height) // 2))
        im = canvas
    im.save(dst, 'JPEG', quality=85, optimize=True)
    return 'share.jpg'


# ---------------------------------------------------------------- data
class Data:
    def __init__(self):
        info = read_json(ROOT / 'data' / 'projects-info.json')
        self.projects = info['projects']
        lab = read_json(ROOT / 'data' / 'lab.json')
        self.members = lab if isinstance(lab, list) else next(v for v in lab.values() if isinstance(v, list))
        videos = read_json(ROOT / 'data' / 'videos.json')
        self.videos = {v['id']: v for v in (videos.get('videos', []) if isinstance(videos, dict) else videos)}
        self.media = {m['href']: m for m in read_json(ROOT / 'data' / 'media.json')}
        self.tools = {t['primaryHref']: t for t in read_json(ROOT / 'data' / 'tools.json').get('tools', [])}
        self.papers = {}
        for folder in (ROOT / 'publications').iterdir():
            if (folder / 'paper.json').exists():
                meta = read_json(folder / 'paper.json')
                md = folder / 'paper.md'
                meta['full_text'] = md.exists() and bool(md.read_text(encoding='utf-8').strip())
                meta['slug'] = folder.name
                meta['url'] = f'/publications/{folder.name}/'
                meta['names'] = [a['name'] for a in meta.get('authors', [])]
                meta['date'] = meta.get('published') or str(meta.get('year') or '')
                self.papers[folder.name] = meta
        for p in self.projects:
            missing = [s for s in p.get('papers', []) if s not in self.papers]
            for s in missing:
                print(f'! {p["slug"]}: no paper page publications/{s}/ - fix "papers" in data/projects-info.json')
            p['_papers'] = sorted((self.papers[s] for s in p.get('papers', []) if s in self.papers),
                                  key=lambda m: (m['date'], m.get('title', '')), reverse=True)

    def member(self, name):
        for m in self.members:
            if same_person(m['name'], name):
                return m
        return None

    def is_lab(self, name):
        return self.member(name) is not None

    def member_link(self, m):
        """The member's profile link from lab.json. A link that several members share (a copy-paste slip) is kept only
        for the member whose name is in it; 'let me google that' links are left out."""
        url = (m.get('info_link') or '').strip()
        if not url or 'letmegooglethat' in url:
            return ''
        owners = [x for x in self.members if (x.get('info_link') or '').strip() == url]
        if len(owners) > 1:
            def named(x):
                return any(t in url.lower() for t in re.split(r'[^a-z]+', plain_name(x['name']).lower()) if len(t) > 2)
            match = [x for x in owners if named(x)]
            keep = match[0] if match else owners[0]
            return url if keep is m else ''
        return url


def lab_status(m):
    return 'current' if (m.get('category_name') or '').lower() == 'current' else 'past'


def rank(title):
    t = (title or '').lower()
    return next((r for k, r in RANKS if k in t), 6)


def role_label(m):
    title = m.get('title') or ''
    if title.strip().upper() == 'PI':
        return 'Principal investigator'
    if lab_status(m) == 'past':
        return {'PhD Student': 'PhD (alumni)', 'MSc Student': 'MSc (alumni)', 'BSc Student': 'BSc (alumni)',
                'Research Assistant': 'Research assistant (alumni)'}.get(title, f'{title} (alumni)')
    return title


def dates_label(m):
    start, end = month(m.get('s_date')), month(m.get('e_date'))
    if lab_status(m) == 'current' or not end:
        return f'Since {fmt_month(start)}' if start else ''
    return f'{fmt_month(start)} – {fmt_month(end)}'


# ---------------------------------------------------------------- page parts
def authors_html(names, data, limit=10):
    shown = names if len(names) <= limit + 1 else names[:limit]
    out = [f'<strong>{esc(n)}</strong>' if data.is_lab(n) else esc(n) for n in shown]
    if len(shown) < len(names):
        out.append(f'and {len(names) - len(shown)} more')
    return ', '.join(out)


def team_lists(p, data):
    """Lab members on this project (current first, then alumni) and collaborators, each with their papers here."""
    current, past, collab = [], [], []
    for entry in p.get('team', []):
        papers = sum(1 for m in p['_papers'] if any(same_person(entry['name'], a) for a in m['names']))
        m = data.member(entry['name'])
        if m:
            person = {'name': m['name'], 'photo': m.get('image_link') or 'img/lab/user.webp', 'role': role_label(m),
                      'dates': dates_label(m), 'focus': entry.get('focus') or '', 'link': data.member_link(m), 'papers': papers,
                      'rank': rank(m.get('title')), 'start': month(m.get('s_date')) or (0, 0)}
            (current if lab_status(m) == 'current' else past).append(person)
        else:
            links = entry.get('links') or {}
            link = links.get('google_scholar') or links.get('website') or links.get('linkedin') or ''
            collab.append({'name': entry['name'], 'photo': entry.get('avatar') or 'img/lab/user.webp', 'role': entry.get('role') or 'Collaborator',
                           'dates': '', 'focus': entry.get('focus') or '', 'link': link, 'papers': papers})
    current.sort(key=lambda x: (x['rank'], x['start'][0], x['start'][1] or 0))
    past.sort(key=lambda x: (x['rank'], x['name']))
    return current, past, collab


def coauthors(p, data, exclude):
    """People outside the lab who co-wrote two or more of the project's papers."""
    counts, names = collections.Counter(), collections.defaultdict(collections.Counter)
    for m in p['_papers']:
        seen = set()
        for a in m['names']:
            parts = plain_name(a).split()
            if len(parts) < 2 or data.is_lab(a) or any(same_person(a, x) for x in exclude):
                continue
            key = norm(parts[0])[:1] + '|' + norm(parts[-1])[:7]
            if key in seen:
                continue
            seen.add(key)
            counts[key] += 1
            names[key][a] += 1
    return [(names[k].most_common(1)[0][0], n) for k, n in counts.most_common() if n >= 2][:16]


def member_card(x):
    link = ''
    if x['link']:
        icon, label = link_icon(x['link'])
        link = f'<a href="{esc(x["link"])}" target="_blank" rel="noopener" aria-label="{esc(x["name"])} on {label}" title="{label}"><i class="{icon}" aria-hidden="true"></i></a>'
    meta = ' · '.join(v for v in (x['role'], x['dates']) if v)
    papers = f'<p class="member-papers">{plural(x["papers"], "paper")} in this project</p>' if x['papers'] else ''
    focus = f'<p class="member-focus">{esc(x["focus"])}</p>' if x['focus'] and x['focus'] != 'Principal investigator' else ''
    return (f'<article class="member"><img src="/{esc(x["photo"])}" alt="{esc(x["name"])}" loading="lazy" decoding="async" width="64" height="64">'
            f'<div><p class="member-name">{esc(x["name"])}{link}</p><p class="member-role">{esc(meta)}</p>{focus}{papers}</div></article>')


def video_card(v):
    short = v.get('format') == 'short'
    thumb = f'https://i.ytimg.com/vi/{v["id"]}/{"sddefault" if short else "maxresdefault"}.jpg'
    watch = f'https://www.youtube.com/{"shorts/" + v["id"] if short else "watch?v=" + v["id"]}'
    paper = v.get('paper') or {}
    plink = ''
    if paper.get('title'):
        plink = f'<p class="card-meta">Based on: {esc(paper["title"])}</p>'
    return (f'<article class="vid-card{" is-short" if short else ""}"><div class="yt-player {"yt-9x16" if short else "yt-16x9"}" data-yt-id="{esc(v["id"])}" '
            f'data-yt-title="{esc(v["title"])}"><a class="yt-play" href="{watch}" aria-label="Play video: {esc(v["title"])}">'
            f'<img src="{thumb}" data-yt-fallbacks="https://i.ytimg.com/vi/{esc(v["id"])}/hqdefault.jpg" alt="" loading="lazy" decoding="async">'
            f'<span class="yt-play-icon" aria-hidden="true"><i class="ri-play-fill"></i></span></a></div>'
            f'<div><p class="vid-title">{esc(v["title"])}</p>{"<p class=vid-text>" + esc(v["summary"]) + "</p>" if v.get("summary") else ""}{plink}'
            f'<p class="vid-links"><a href="/videos.html#v-{esc(v["id"])}">All lab videos</a><a href="{watch}" target="_blank" rel="noopener">Watch on YouTube</a></p></div></article>')


def tool_info(href, data):
    t = data.tools.get(href)
    if t:
        return {'title': t['title'], 'text': t.get('description', ''), 'icon': t.get('icon') or 'ri-tools-line', 'href': '/' + href}
    path = ROOT / href
    if not path.exists():
        return None
    page = path.read_text(encoding='utf-8', errors='ignore')
    title = re.search(r'<title>(.*?)</title>', page, re.S)
    desc = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', page)
    return {'title': re.sub(r'\s*\|.*$', '', title.group(1)).strip() if title else href, 'text': desc.group(1) if desc else '',
            'icon': 'ri-gamepad-line', 'href': '/' + href}


def related_projects(p, data):
    mine_papers, mine_team = set(p.get('papers', [])), {norm(plain_name(t['name'])) for t in p.get('team', [])} - {'teddylazebnik'}
    mine_tags = {t.lower() for t in p.get('tags', [])}
    scored = []
    for q in data.projects:
        if q is p:
            continue
        s = 3 * len(mine_papers & set(q.get('papers', []))) + 2 * len(mine_team & ({norm(plain_name(t['name'])) for t in q.get('team', [])}))
        s += len(mine_tags & {t.lower() for t in q.get('tags', [])}) + (2 if q.get('category') == p.get('category') else 0)
        scored.append((s, q))
    scored.sort(key=lambda x: -x[0])
    return [q for s, q in scored[:3]]


def status_html(p):
    s = 'completed' if (p.get('status') or '').lower() == 'completed' else 'ongoing'
    return f'<span class="status is-{s}">{s.capitalize()}</span>'


def years_span(papers):
    years = sorted({int(str(m.get('year') or m['date'])[:4]) for m in papers if str(m.get('year') or m['date'])[:4].isdigit()})
    return years


# ---------------------------------------------------------------- one page
def build_one(p, data, template):
    slug = p['slug']
    out_dir = ROOT / 'projects' / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    url = f'{SITE}/projects/{slug}/'
    papers = p['_papers']
    current, past, collab = team_lists(p, data)
    lab_people = current + past
    years = years_span(papers)
    videos = [data.videos[v] for v in p.get('videos', []) if v in data.videos]
    media = sorted((data.media[h] for h in p.get('media', []) if h in data.media), key=lambda m: m.get('dateISO', ''), reverse=True)
    tools = [t for t in (tool_info(h, data) for h in p.get('tools', [])) if t]
    others = coauthors(p, data, [c['name'] for c in collab])
    img = p.get('heroImage') or p.get('image') or 'img/logo.png'
    status = 'completed' if (p.get('status') or '').lower() == 'completed' else 'ongoing'
    start, end = period_parts(p.get('period'))
    papers_label = p.get('papers_label') or 'Publications'

    # hero
    stats = [(len(papers), 'publications' if papers_label == 'Publications' else 'related papers'),
             (len(lab_people), 'lab members, current and past'),
             (len(others) + len(collab), 'collaborators and frequent co-authors')]
    if years:
        stats.append((f'{years[0]}–{years[-1]}' if years[0] != years[-1] else str(years[0]), 'years of papers'))
    else:
        stats.append((fmt_period(p.get('period')).split(' – ')[0].split(' ')[-1] or '–', 'project start'))
    stats = [(v, t) for v, t in stats if v not in (0, '0', '', '–')]
    stats_html = ''.join(f'<div class="proj-stat"><strong{" class=is-long" if len(str(v)) > 5 else ""}>{esc(v)}</strong><span>{esc(t)}</span></div>' for v, t in stats)
    actions = []
    if papers:
        actions.append('<a class="proj-btn proj-btn-primary" href="#publications"><i class="ri-article-line" aria-hidden="true"></i>See the papers</a>')
    actions.append(f'<a class="proj-btn{"" if papers else " proj-btn-primary"}" href="#team"><i class="ri-team-line" aria-hidden="true"></i>Meet the team</a>')
    if videos:
        actions.append('<a class="proj-btn" href="#videos"><i class="ri-play-circle-line" aria-hidden="true"></i>Watch</a>')
    actions.append('<a class="proj-btn proj-btn-quiet" href="/#contact"><i class="ri-mail-line" aria-hidden="true"></i>Contact us</a>')
    hero = f'''    <header class="proj-hero">
      <div class="proj-wrap proj-hero-grid">
        <div>
          <nav class="proj-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><i class="ri-arrow-right-s-line" aria-hidden="true"></i><a href="/projects.html">Projects</a><i class="ri-arrow-right-s-line" aria-hidden="true"></i><span>{esc(p.get("category", ""))}</span></nav>
          <p class="proj-kicker">{status_html(p)}<span><i class="ri-calendar-line" aria-hidden="true"></i>{esc(fmt_period(p.get("period")))}</span><span><i class="ri-price-tag-3-line" aria-hidden="true"></i>{esc(p.get("category", ""))}</span></p>
          <h1 class="proj-title">{esc(p["title"])}</h1>
          <p class="proj-subtitle">{esc(p.get("subtitle") or p.get("summary") or "")}</p>
          <div class="proj-stats">{stats_html}</div>
          <div class="proj-actions">{"".join(actions)}</div>
        </div>
        <figure class="proj-hero-img"><img src="/{esc(img)}" alt="{esc(p["title"])}"{sized(img)} fetchpriority="high" decoding="async"></figure>
      </div>
    </header>'''

    sections, menu = [], []

    def add(sid, label, html_, soft=False):
        menu.append(f'<li><a href="#{sid}">{label}</a></li>')
        sections.append(f'    <section id="{sid}" class="proj-section{" is-soft" if soft else ""}" aria-labelledby="{sid}-title"><div class="proj-wrap">\n{html_}\n    </div></section>')

    # overview
    lead = p.get('summary') or ''
    glance = [('Status', status_html(p)), ('Period', esc(fmt_period(p.get('period')))), ('Research area', esc(p.get('category', ''))),
              ('Principal investigator', '<a href="https://teddylazebnik.com" target="_blank" rel="noopener">Prof. Teddy Lazebnik</a>')]
    if lab_people:
        glance.append(('Lab members', f'{len(current)} current · {len(past)} past'))
    if papers:
        glance.append((papers_label, f'<a href="#publications">{plural(len(papers), "paper")}</a>' + (f' ({years[0]}–{years[-1]})' if len(years) > 1 else '')))
    if p.get('tags'):
        glance.append(('Keywords', '<div class="proj-tags">' + ''.join(f'<span class="proj-tag">{esc(t)}</span>' for t in p['tags']) + '</div>'))
    glance_html = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in glance)
    add('overview', 'Overview', f'''      <div class="proj-overview">
        <div class="proj-about">
          <p class="proj-label"><i class="ri-compass-3-line" aria-hidden="true"></i>About the project</p>
          <h2 id="overview-title" class="proj-h2" style="margin-top:.5rem">What this project is about</h2>
          {"<p class=proj-about-lead>" + esc(lead) + "</p>" if lead else ""}
          <p>{esc(p.get("description", ""))}</p>
        </div>
        <aside class="proj-glance"><p class="proj-label"><i class="ri-information-line" aria-hidden="true"></i>At a glance</p><dl>{glance_html}</dl></aside>
      </div>''')

    # methods + outcomes
    if p.get('methods') or p.get('outcomes'):
        meth = ''.join(f'<li><i class="ri-checkbox-circle-line" aria-hidden="true"></i>{esc(m)}</li>' for m in p.get('methods', []))
        outc = ''.join(f'<li><i class="ri-flag-2-line" aria-hidden="true"></i>{esc(o)}</li>' for o in p.get('outcomes', []))
        add('approach', 'Approach', f'''      <h2 id="approach-title" class="proj-h2">Approach and outcomes</h2>
      <p class="proj-lead">The methods the project relies on and what it has produced so far.</p>
      <div class="proj-two">
        <div class="proj-card"><h3 class="proj-h3">Methods</h3><ul class="proj-checks">{meth}</ul></div>
        <div class="proj-card"><h3 class="proj-h3">Key outcomes</h3><ul class="proj-checks">{outc}</ul></div>
      </div>''', soft=True)

    # selected findings: recent papers with a figure and a plain-language summary
    picks = [m for m in papers if m.get('featured_figure') and m.get('summary')
             and (ROOT / 'publications' / m['slug'] / 'figures' / f'{m["featured_figure"]}.webp').exists()][:3]
    if picks and papers_label == 'Publications':
        cards = []
        for m in picks:
            fig = f'publications/{m["slug"]}/figures/{m["featured_figure"]}.webp'
            found = [k for k in (m.get('key_findings') or []) if not METHOD_RE.match(k)]
            finding = (found or m.get('key_findings') or [m['summary']])[0]
            cards.append(f'<a class="hl-card" href="{m["url"]}"><div class="hl-fig"><img src="/{fig}" alt="Figure from: {esc(m["title"])}" loading="lazy" decoding="async"{sized(fig)}></div>'
                         f'<div class="hl-body"><p class="hl-meta">{esc(m.get("journal", ""))}{" · " if m.get("journal") else ""}{esc(str(m.get("year", "")))}</p>'
                         f'<p class="hl-title">{esc(m["title"])}</p><p class="hl-text">{esc(clip(finding, 230))}</p>'
                         f'<span class="hl-more">Read the paper <i class="ri-arrow-right-line" aria-hidden="true"></i></span></div></a>')
        add('findings', 'Findings', f'''      <p class="proj-label"><i class="ri-lightbulb-flash-line" aria-hidden="true"></i>Recent results</p>
      <h2 id="findings-title" class="proj-h2" style="margin-top:.5rem">Selected findings</h2>
      <p class="proj-lead">A key finding from each of the project's latest papers. Every paper page has the full text, figures and a plain-language summary.</p>
      <div class="proj-highlights">{"".join(cards)}</div>''')

    # publications
    if papers:
        by_year = collections.defaultdict(list)
        for m in papers:
            by_year[str(m.get('year') or m['date'][:4])].append(m)
        chart = ''
        if len(years) > 1:
            top = max(len(by_year[str(y)]) for y in years)
            bars, labels = [], []
            for y in range(years[0], years[-1] + 1):
                n = len(by_year.get(str(y), []))
                bars.append(f'<div class="pub-bar{" is-zero" if not n else ""}" title="{y}: {plural(n, "paper")}"><b>{n or ""}</b><span style="height:{max(2, round(100 * n / top * .82))}%"></span></div>')
                labels.append(f'<span>{y}</span>')
            chart = f'<div class="pub-chart" role="img" aria-label="Papers per year">{"".join(bars)}</div><div class="pub-years" aria-hidden="true">{"".join(labels)}</div>'
        groups = []
        for y in sorted(by_year, reverse=True):
            items = []
            for m in by_year[y]:
                links = [f'<a href="{m["url"]}"><i class="ri-article-line" aria-hidden="true"></i>Paper page</a>']
                if m.get('pdf_url'):
                    links.append(f'<a href="{esc(m["pdf_url"])}" target="_blank" rel="noopener"><i class="ri-file-pdf-2-line" aria-hidden="true"></i>PDF</a>')
                if m.get('doi'):
                    links.append(f'<a href="https://doi.org/{esc(m["doi"])}" target="_blank" rel="noopener"><i class="ri-external-link-line" aria-hidden="true"></i>DOI</a>')
                badge = '<span class="pub-badge"><i class="ri-file-text-line" aria-hidden="true"></i>Full text on the site</span>' if m['full_text'] else ''
                venue = f'<em>{esc(m["journal"])}</em> · ' if m.get('journal') else ''
                summary = f'<p class="pub-summary">{esc(clip(m["summary"], 260))}</p>' if m.get('summary') else ''
                items.append(f'<li class="pub-item"><a class="pub-title" href="{m["url"]}">{esc(m["title"])}</a>'
                             f'<p class="pub-authors">{authors_html(m["names"], data)}</p><p class="pub-venue"><span>{venue}{esc(y)}</span>{badge}</p>{summary}'
                             f'<p class="pub-links">{"".join(links)}</p></li>')
            groups.append(f'<div class="pub-year"><h3>{esc(y)} <small>{plural(len(by_year[y]), "paper")}</small></h3><ul class="pub-list">{"".join(items)}</ul></div>')
        note = f'<p class="pub-note">{esc(p["papers_note"])}</p>' if p.get('papers_note') else ''
        filt = ('<label class="pub-filter"><i class="ri-search-line" aria-hidden="true"></i><input id="pub-filter-input" type="search" '
                'placeholder="Filter these papers" aria-label="Filter the papers by title, author, journal or words in the summary" autocomplete="off"></label>') if len(papers) > 5 else ''
        add('publications', papers_label, f'''      <div class="pub-head">
        <div><h2 id="publications-title" class="proj-h2">{esc(papers_label)}</h2>
        <p class="proj-lead">{"Every paper from this project, newest first. Lab members are in bold; each title opens the paper's own page with the abstract, a plain-language summary and, for most papers, the full text." if papers_label == "Publications" else "Lab members are in bold; each title opens the paper's own page."}</p>{note}</div>
        {filt}
      </div>
      {chart}
      <p class="pub-count" id="pub-count" aria-live="polite">{plural(len(papers), "paper")}</p>
      {"".join(groups)}
      <p class="pub-empty" id="pub-empty" hidden>No paper matches these words.</p>''', soft=True)

    # team
    team_parts = []
    if current:
        team_parts.append(f'<div class="team-group"><h3 class="proj-h3">Current members <small>{len(current)}</small></h3><div class="team-grid">{"".join(member_card(x) for x in current)}</div></div>')
    if past:
        team_parts.append(f'<div class="team-group"><h3 class="proj-h3">Past members <small>{len(past)}</small></h3><div class="team-grid">{"".join(member_card(x) for x in past)}</div></div>')
    if collab:
        team_parts.append(f'<div class="team-group"><h3 class="proj-h3">Collaborators <small>{len(collab)}</small></h3><div class="team-grid">{"".join(member_card(x) for x in collab)}</div></div>')
    if others:
        chips = ''.join(f'<span class="coauthor">{esc(n)} <small>{plural(c, "paper")}</small></span>' for n, c in others)
        team_parts.append(f'<div class="team-group"><h3 class="proj-h3">Frequent co-authors</h3><p class="proj-lead">Researchers outside the lab who co-wrote two or more of the papers above.</p><div class="coauthors">{chips}</div></div>')
    add('team', 'Team', f'''      <h2 id="team-title" class="proj-h2">The team</h2>
      <p class="proj-lead">The lab members who work or worked on this project, with their part in it, and the researchers we work with. See the whole lab on the <a href="/team.html" class="text-primary">team page</a>.</p>
      <div style="margin-top:1.5rem">{"".join(team_parts)}</div>''')

    # timeline
    if p.get('timeline'):
        tl = ''.join(f'<li><time>{esc(t.get("date", ""))}</time><h3>{esc(t.get("title", ""))}</h3><p>{esc(t.get("text", ""))}</p></li>' for t in p['timeline'])
        add('timeline', 'Timeline', f'''      <h2 id="timeline-title" class="proj-h2">Timeline</h2>
      <p class="proj-lead">How the project developed.</p>
      <ol class="proj-timeline">{tl}</ol>''', soft=True)

    if videos:
        add('videos', 'Videos', f'''      <h2 id="videos-title" class="proj-h2">Videos</h2>
      <p class="proj-lead">Short explainers of the research in this project.</p>
      <div class="proj-grid">{"".join(video_card(v) for v in videos)}</div>''')
    if media:
        cards = []
        for m in media:
            ext = m['href'].startswith('http')
            date = ''
            try:
                d = dt.date.fromisoformat(m.get('dateISO', ''))
                date = f'{MONTHS[d.month - 1]} {d.year}'
            except ValueError:
                date = m.get('dateLabel', '')
            cards.append(f'<a class="media-card" href="{esc(m["href"])}"{" target=_blank rel=noopener" if ext else ""}><img src="/{esc(m["image"].lstrip("/"))}" alt="" loading="lazy" decoding="async">'
                         f'<div class="card-body"><p class="card-meta">{esc(m.get("outlet", ""))} · {esc(date)}</p><p class="card-title">{esc(m["title"])}</p></div></a>')
        add('media', 'In the media', f'''      <h2 id="media-title" class="proj-h2">In the media</h2>
      <p class="proj-lead">News stories, interviews and podcasts about this project's research. More on the <a href="/media.html" class="text-primary">media page</a>.</p>
      <div class="proj-grid is-3">{"".join(cards)}</div>''', soft=not videos)
    if tools:
        cards = ''.join(f'<a class="tool-card" href="{esc(t["href"])}"><div class="card-body"><span class="tool-icon"><i class="{esc(t["icon"])}" aria-hidden="true"></i></span>'
                        f'<p class="card-title">{esc(t["title"])}</p><p class="card-text">{esc(t["text"])}</p><span class="card-more">Try it <i class="ri-arrow-right-line" aria-hidden="true"></i></span></div></a>'
                        for t in tools)
        add('tools', 'Tools', f'''      <h2 id="tools-title" class="proj-h2">Interactive tools</h2>
      <p class="proj-lead">Browser tools and simulations that grew out of this research.</p>
      <div class="proj-grid is-3">{cards}</div>''')
    rel = related_projects(p, data)
    if rel:
        cards = ''.join(f'<a class="rel-card" href="/projects/{esc(q["slug"])}/"><img src="/{esc(q.get("image", ""))}" alt="" loading="lazy" decoding="async">'
                        f'<div class="card-body"><p class="card-meta">{esc(q.get("category", ""))} · {plural(len(q["_papers"]), "paper")}</p><p class="card-title">{esc(q["title"])}</p>'
                        f'<p class="card-text">{esc(clip(q.get("summary", ""), 150))}</p></div></a>' for q in rel)
        add('related', 'Related', f'''      <h2 id="related-title" class="proj-h2">Related projects</h2>
      <div class="proj-grid is-3">{cards}</div>''', soft=True)

    subnav = f'    <nav class="proj-subnav" aria-label="Sections of this page"><div class="proj-wrap"><ul>{"".join(menu)}</ul></div></nav>'
    cta = f'''    <div class="proj-cta"><div class="proj-cta-box">
      <div><h2>Interested in this project?</h2><p>We welcome collaborations, data partnerships and students who want to work on {esc(p.get("category", "this topic").lower())} problems with us.</p></div>
      <div class="proj-actions"><a class="proj-btn proj-btn-primary" href="/#contact"><i class="ri-mail-send-line" aria-hidden="true"></i>Get in touch</a><a class="proj-btn" href="/projects.html"><i class="ri-apps-2-line" aria-hidden="true"></i>All projects</a></div>
    </div></div>'''

    # search-engine data
    share = share_image(p, out_dir)
    desc = clip(f'{p.get("summary", "")} {p.get("subtitle", "")}'.strip(), 158)
    people = [{'@type': 'Person', 'name': plain_name(x['name']), 'jobTitle': x['role'],
               **({'sameAs': x['link']} if x['link'] else {})} for x in lab_people + collab]
    project_ld = {
        '@type': 'ResearchProject', '@id': url + '#project', 'name': p['title'], 'url': url, 'description': p.get('description') or desc,
        'disambiguatingDescription': p.get('subtitle') or None, 'image': SITE + '/' + img, 'keywords': ', '.join(p.get('tags', [])) or None,
        'knowsAbout': p.get('methods') or None, 'foundingDate': iso_month(start),
        'dissolutionDate': iso_month(end) if status == 'completed' else None,
        'founder': {'@type': 'Person', 'name': 'Teddy Lazebnik', 'url': 'https://teddylazebnik.com'},
        'parentOrganization': {'@type': 'ResearchOrganization', 'name': 'Applied Computational Mathematics Laboratory', 'alternateName': 'ACML', 'url': SITE + '/'},
        'member': people or None,
        'subjectOf': [{'@type': 'ScholarlyArticle', 'headline': m['title'], 'url': SITE + m['url'], 'datePublished': m['date'] or None,
                       **({'sameAs': f'https://doi.org/{m["doi"]}'} if m.get('doi') else {})} for m in papers] or None,
    }
    project_ld = {k: v for k, v in project_ld.items() if v}
    crumbs = {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Projects', 'item': SITE + '/projects.html'},
        {'@type': 'ListItem', 'position': 3, 'name': p['title'], 'item': url}]}
    jsonld = {'@context': 'https://schema.org', '@graph': [project_ld, crumbs]}

    values = {
        'page_title': esc(clip(p['title'], 80)) + ' | ACML research project',
        'description': esc(desc), 'url': url, 'share_url': url + share, 'og_title': esc(p['title']),
        'keywords': esc(', '.join(p.get('tags', []) + [p.get('category', '')])),
        'jsonld': json.dumps(jsonld, ensure_ascii=False, indent=2).replace('</', '<\\/'),
        'videos_css': '<link href="/css/videos.css" rel="stylesheet">' if videos else '',
        'videos_js': '<script src="/js/videos.js"></script>' if videos else '',
        'hero': hero, 'subnav': subnav, 'sections': '\n'.join(sections), 'cta': cta,
    }
    page = Template(template).substitute(values)
    path = out_dir / 'index.html'
    old = path.read_text(encoding='utf-8') if path.exists() else ''
    if old != page:
        path.write_text(page, encoding='utf-8')
    return {'slug': slug, 'url': f'projects/{slug}/', 'title': p['title'], 'summary': p.get('summary', ''), 'subtitle': p.get('subtitle', ''),
            'changed': old != page, 'image': img, 'status': status, 'period': fmt_period(p.get('period')), 'category': p.get('category', ''),
            'papers': papers, 'current': current, 'past': past, 'collab': collab, 'videos': videos, 'tags': p.get('tags', []), 'project': p}


# ---------------------------------------------------------------- projects.html, sitemap.xml, llms.txt
def update_project_list(built):
    """The project cards on projects.html (plain HTML between the markers)."""
    path = ROOT / 'projects.html'
    text = path.read_text(encoding='utf-8')
    order = sorted(built, key=lambda b: b['status'] == 'completed')
    cards = []
    for b in order:
        people = b['current'] + b['past']
        faces = ''.join(f'<img src="/{esc(x["photo"])}" alt="{esc(x["name"])}" title="{esc(x["name"])}" loading="lazy" decoding="async" width="34" height="34">' for x in people[:7])
        more = f'<span>+{len(people) - 7}</span>' if len(people) > 7 else ''
        counts = [f'<span><i class="ri-article-line" aria-hidden="true"></i>{plural(len(b["papers"]), "paper")}</span>' if b['papers'] else '',
                  f'<span><i class="ri-team-line" aria-hidden="true"></i>{plural(len(people), "lab member")}</span>',
                  f'<span><i class="ri-play-circle-line" aria-hidden="true"></i>{plural(len(b["videos"]), "video")}</span>' if b['videos'] else '']
        tags = ''.join(f'<span class="proj-tag">{esc(t)}</span>' for t in b['tags'][:5])
        href = f'/projects/{b["slug"]}/'
        cards.append(f'''      <article class="pl-card">
        <a class="pl-media" href="{href}" tabindex="-1" aria-hidden="true"><img src="/{esc(b["image"])}" alt="" loading="lazy" decoding="async"></a>
        <div>
          <p class="pl-meta">{status_html(b["project"])}<span>{esc(b["category"])}</span><span>{esc(b["period"])}</span></p>
          <h3 class="pl-title"><a href="{href}">{esc(b["title"])}</a></h3>
          <p class="pl-summary">{esc(b["summary"] or b["subtitle"])}</p>
          <p class="pl-counts">{"".join(c for c in counts if c)}</p>
          <div class="proj-tags">{tags}</div>
          <div class="pl-foot"><div class="pl-team">{faces}{more}</div><a class="pl-more" href="{href}">Explore the project <i class="ri-arrow-right-line" aria-hidden="true"></i></a></div>
        </div>
      </article>''')
    block = (f'    <!-- {LIST_START} -->\n    <div id="project-list" class="pl-list">\n' + '\n'.join(cards) +
             f'\n    </div>\n    <!-- {LIST_END} -->\n')
    new = replace_block(text, LIST_START, LIST_END, block)
    if new is None:
        old = re.search(r'[ \t]*<!-- Container for dynamic projects -->\s*\n[ \t]*<div id="projects-container"[^>]*></div>\s*\n', text)
        if not old:
            old = re.search(r'[ \t]*<div id="projects-container"[^>]*></div>\s*\n', text)
        new = text[:old.start()] + block + text[old.end():]
    if '/css/project.css' not in new:
        new = new.replace('<link href="css/tailwind.css" rel="stylesheet">', '<link href="css/tailwind.css" rel="stylesheet">\n      <link href="/css/project.css" rel="stylesheet">', 1)
    # the list in the page's structured data
    items = [{'@type': 'ListItem', 'position': i + 1, 'url': f'{SITE}/projects/{b["slug"]}/', 'name': b['title']} for i, b in enumerate(order)]
    ld = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'Projects | Applied Computational Mathematics Laboratory',
          'url': f'{SITE}/projects.html',
          'description': 'Explore ACML research projects across epidemiology, AI, scientometrics, animal behavior, economics, and applied computational mathematics.',
          'about': {'@type': 'Organization', 'name': 'Applied Computational Mathematics Laboratory', 'url': f'{SITE}/'},
          'mainEntity': {'@type': 'ItemList', 'name': 'ACML research projects', 'numberOfItems': len(items), 'itemListElement': items}}
    ld_text = json.dumps(ld, ensure_ascii=False, indent=2).replace('\n', '\n      ')
    new = re.sub(r'(<script type="application/ld\+json">)\s*.*?\s*(</script>)', lambda m: f'{m.group(1)}\n      {ld_text}\n      {m.group(2)}', new, count=1, flags=re.S)
    if new != text:
        path.write_text(new, encoding='utf-8')


def update_sitemap(built, today):
    path = ROOT / 'sitemap.xml'
    raw = path.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw.decode('utf-8-sig')
    eol = '\r\n' if '\r\n' in text else '\n'
    # the old JavaScript project page is now a redirect: take it (and its ?pagename= addresses) out
    text = re.sub(r'[ \t]*<url>\s*<loc>[^<]*/project\.html(\?[^<]*)?</loc>.*?</url>[ \t]*\r?\n', '', text, flags=re.S)
    if IMAGE_NS not in text:
        text = text.replace('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' + eol + '  ' + IMAGE_NS, 1)
    old = dict(re.findall(r'<loc>(.*?)</loc>\s*<lastmod>(.*?)</lastmod>', text))
    lines = [f'  <!-- {MARK_START} -->']
    for b in built:
        loc = f'{SITE}/{b["url"]}'
        lastmod = old.get(loc) if not b['changed'] and old.get(loc) else f'{today}T00:00:00.000Z'
        lines += ['  <url>', f'    <loc>{loc}</loc>', f'    <lastmod>{lastmod}</lastmod>', '    <priority>0.85</priority>',
                  f'    <image:image><image:loc>{SITE}/{b["image"]}</image:loc></image:image>', '  </url>']
    lines.append(f'  <!-- {MARK_END} -->')
    block = eol.join(lines) + eol
    new = replace_block(text, MARK_START, MARK_END, block)
    if new is None:
        anchor = text.find('  <!-- paper pages: start')
        i = anchor if anchor != -1 else text.index('</urlset>')
        new = text[:i] + block + text[i:]
    path.write_bytes((b'\xef\xbb\xbf' if bom else b'') + new.encode('utf-8'))


def update_llms(built):
    path = ROOT / 'llms.txt'
    if not path.exists():
        return
    raw = path.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw.decode('utf-8-sig')
    eol = '\r\n' if '\r\n' in text else '\n'
    lines = [f'<!-- {MARK_START} -->', '## Projects', '',
             f'Each ACML research project has its own page ({len(built)} pages) with an overview, methods, outcomes, a timeline, the full list of '
             'its papers (linked to the paper pages), the current and past lab members who work on it, collaborators, and related videos, media '
             'coverage and tools.', '']
    for b in sorted(built, key=lambda b: (b['status'] == 'completed', b['title'])):
        p = b['project']
        cur = ', '.join(plain_name(x['name']) for x in b['current'])
        past = ', '.join(plain_name(x['name']) for x in b['past'])
        col = ', '.join(x['name'] for x in b['collab'])
        team = '; '.join(x for x in [f'current lab members: {cur}' if cur else '', f'past lab members: {past}' if past else '',
                                      f'collaborators: {col}' if col else ''] if x)
        n = len(b['papers'])
        papers = (f' {plural(n, "paper")}' + (f', e.g. ' + '; '.join(f'[{m["title"]}]({SITE}{m["url"]})' for m in b['papers'][:3]) if n else '') + '.') if n else ''
        lines.append(f'- [{b["title"]}]({SITE}/{b["url"]}): {b["status"].capitalize()}, {b["period"]}. {p.get("summary", "")} '
                     f'{re.sub(r"[.]$", "", p.get("subtitle", ""))}. Team ({team}).{papers}')
    lines += ['', f'<!-- {MARK_END} -->']
    block = eol.join(lines) + eol
    new = replace_block(text, MARK_START, MARK_END, block)
    if new is None:
        anchor = text.find('<!-- paper pages: start')
        new = (text[:anchor] + block + eol + text[anchor:]) if anchor != -1 else text.rstrip() + eol + eol + block
    path.write_bytes((b'\xef\xbb\xbf' if bom else b'') + new.encode('utf-8'))


def main():
    data = Data()
    template = TEMPLATE.read_text(encoding='utf-8')
    built = [build_one(p, data, template) for p in data.projects]
    update_project_list(built)
    today = dt.date.today().isoformat()
    update_sitemap(built, today)
    update_llms(built)
    print(f'{len(built)} project pages ({sum(1 for b in built if b["changed"])} changed); projects.html, sitemap.xml and llms.txt updated.')


if __name__ == '__main__':
    main()
