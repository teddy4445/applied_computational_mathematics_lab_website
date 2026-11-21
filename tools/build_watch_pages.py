#!/usr/bin/env python3
"""Build a watch page for every video in data/videos.json: watch/<slug>/index.html.

Google shows a page in its video results only when the video is the main thing on that page, and only when the page
says what the video is (VideoObject structured data). The Videos page and the paper pages show many videos or show the
video next to a paper, so each video gets its own page here: the player at the top, the summary, the paper it is based
on, and links to related videos.

Data:
  data/videos.json        the videos; each needs "published" (when it went public on YouTube, as an ISO time in UTC, or
                          the YYYY-MM-DD date it is scheduled for) and "duration" (m:ss or h:mm:ss). Videos without
                          them get no page (they are listed).
  data/paper-pages.json   which papers have a page on the site (to link the paper behind a video)

Writes:
  watch/<slug>/index.html  one page per video
  watch/<slug>/share.jpg   its link preview (tools/share_cards.py)
  data/watch-pages.json    id -> page, read by js/videos.js to link each card on videos.html to its page.
                           Slugs already in this file are kept, so page addresses don't change when a title does.
  sitemap-videos.xml       every watch page; videos already public get a <video:video> entry
  robots.txt               adds the Sitemap line for sitemap-videos.xml if it is missing

A video that is still scheduled on YouTube gets its page too, but with a "coming on <date>" card instead of the
player, and its VideoObject data waits in the page; js/watch.js shows the player and adds the data from the release
date on, so nothing needs rebuilding on the day. Running this script again after release makes that part static.

    python tools/build_watch_pages.py            (add --today YYYY-MM-DD to build as of another date)
"""
import argparse
import datetime as dt
import json
import re
import sys
import unicodedata
from pathlib import Path
from string import Template

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_papers import ROOT, SITE, read_json, norm, esc, clip  # noqa: E402
import share_cards  # noqa: E402

TEMPLATE = ROOT / 'tools' / 'templates' / 'watch.html'
OUT_DIR = ROOT / 'watch'
PAGES_JSON = ROOT / 'data' / 'watch-pages.json'
SITEMAP = ROOT / 'sitemap-videos.xml'
MARK = 'Made by tools/build_watch_pages.py'
ORG = {'@type': 'Organization', 'name': 'Applied Computational Mathematics Laboratory', 'url': SITE + '/',
       'logo': {'@type': 'ImageObject', 'url': SITE + '/img/logo.png'}}
SERIES = {  # section -> (name, chip id on videos.html)
    'natures-algorithms': ("Nature's Algorithms", 'natures-algorithms'),
    'mathematics-of-beauty': ('The Mathematics of Beauty', 'mathematics-of-beauty'),
    'estimate-it': ('Estimate It', 'estimate-it'),
    'academia-decoded': ('Academia Decoded', 'academia-decoded'),
}
RELEASE_UTC_HOUR = 20   # a scheduled video is treated as public from 20:00 UTC on its date (they go live earlier that day)


def slugify(text, limit=72):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    text = re.sub(r"['’`]", '', text)
    words = [w for w in re.split(r'[^a-z0-9]+', text) if w]
    out = ''
    for w in words:
        if out and len(out) + 1 + len(w) > limit:
            break
        out = f'{out}-{w}' if out else w
    return out or 'video'


def seconds(duration):
    parts = [int(p) for p in str(duration).split(':')]
    total = 0
    for p in parts:
        total = total * 60 + p
    return total


def iso_duration(sec):
    h, m, s = sec // 3600, sec % 3600 // 60, sec % 60
    return 'PT' + (f'{h}H' if h else '') + (f'{m}M' if m else '') + (f'{s}S' if s or not (h or m) else '')


def day(published):
    return str(published)[:10]


def nice_date(iso):
    d = dt.date.fromisoformat(day(iso))
    return f'{d.day} {d.strftime("%B %Y")}'


def is_short(v):
    return v.get('format') == 'short'


def thumbs(vid, short):
    sizes = ['hqdefault', 'mqdefault'] if short else ['maxresdefault', 'hqdefault', 'mqdefault']
    return [f'https://i.ytimg.com/vi/{vid}/{s}.jpg' for s in sizes]


def youtube_url(v):
    return f'https://www.youtube.com/shorts/{v["id"]}' if is_short(v) else f'https://www.youtube.com/watch?v={v["id"]}'


def group_of(v):
    """(name, videos.html URL) of the shelf a video sits on: its series, else its topic."""
    if v.get('section') in SERIES:
        name, chip = SERIES[v['section']]
        return name, f'/videos.html?section={chip}'
    if v.get('topic'):
        return v['topic'], '/videos.html?topic=' + re.sub(r'\s', '+', v['topic'])
    return 'All videos', '/videos.html'


def paper_link(v, pages):
    """(site page or None, outside link or None) for the paper behind a video."""
    paper = v.get('paper') or {}
    if not paper.get('title'):
        return None, None
    page = pages.get(norm(paper['title']))
    url = paper.get('url') or ''
    if page:
        site_page = '/' + page['url']
    elif url and '://' not in url:
        site_page = url if url.startswith('/') else '/' + url
    else:
        site_page = None
    outside = url if url.startswith('http') else (f'https://doi.org/{page["doi"]}' if page and page.get('doi') else None)
    return site_page, outside


def video_ld(v, url, pages):
    short = is_short(v)
    site_page, outside = paper_link(v, pages)
    desc = v.get('summary') or v['title']
    paper = v.get('paper') or {}
    if paper.get('title'):
        desc += f' Based on the paper "{paper["title"]}"' + (f' ({paper["venue"]}).' if paper.get('venue') else '.')
    ld = {
        '@context': 'https://schema.org', '@type': 'VideoObject',
        'name': v['title'], 'description': desc,
        'thumbnailUrl': thumbs(v['id'], short),
        'uploadDate': v['published'],
        'duration': iso_duration(seconds(v['duration'])),
        'embedUrl': f'https://www.youtube.com/embed/{v["id"]}',
        'url': url,
        'inLanguage': 'en', 'isFamilyFriendly': True,
        'publisher': ORG, 'creator': ORG,
    }
    if v.get('topic'):
        ld['keywords'] = v['topic']
    if paper.get('title'):
        art = {'@type': 'ScholarlyArticle', 'name': paper['title']}
        if site_page:
            art['url'] = SITE + site_page
        if outside:
            art['sameAs'] = outside
        ld['isBasedOn'] = art
    if v.get('section') in SERIES:
        ld['isPartOf'] = {'@type': 'CreativeWorkSeries', 'name': SERIES[v['section']][0]}
    return ld


def crumbs_ld(v, url):
    name, link = group_of(v)
    items = [('Home', SITE + '/'), ('Videos', SITE + '/videos.html'), (name, SITE + link), (v['title'], url)]
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList',
            'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]}


def indent_json(obj, pad='        '):
    return '\n'.join(pad + line for line in json.dumps(obj, ensure_ascii=False, indent=2).split('\n')).replace('</', '<\\/')


def player_html(v, public):
    short = is_short(v)
    ratio = 'yt-9x16' if short else 'yt-16x9'
    src = f'https://www.youtube-nocookie.com/embed/{v["id"]}?rel=0&amp;playsinline=1'
    frame = (f'<iframe src="{src}" title="{esc(v["title"])}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; '
             f'picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>')
    if public:
        return f'          <div class="watch-player {ratio}">{frame}</div>'
    return (f'          <div class="watch-player {ratio} is-coming" data-release="{day(v["published"])}T{RELEASE_UTC_HOUR:02d}:00:00Z" '
            f'data-src="{src}" data-title="{esc(v["title"])}">\n'
            f'            <div class="watch-coming"><i class="ri-time-line" aria-hidden="true"></i>'
            f'<p class="watch-coming-title">Coming on {nice_date(v["published"])}</p>'
            f'<p>This video goes public on YouTube that day.</p></div>\n'
            f'          </div>')


def related_cards(v, videos, by_id, slugs, today, n=6):
    def public(x):
        return day(x.get('published', '9999')) <= today
    same = [x for x in videos if x is not v and x.get('id') in slugs]
    if v.get('section') in SERIES:
        pool = [x for x in same if x.get('section') == v['section']]
        pool.sort(key=lambda x: abs((x.get('episode') or 0) - (v.get('episode') or 0)))
    else:
        pool = [x for x in same if v.get('topic') and x.get('topic') == v.get('topic') and x.get('section') not in SERIES]
    extra = [x for x in same if x not in pool and x.get('section') not in SERIES and x.get('topic') != v.get('topic')]
    pool.sort(key=lambda x: not public(x))          # public videos first, keeping the order above
    extra = sorted((x for x in extra if public(x)), key=lambda x: x.get('published', ''), reverse=True)
    picked = (pool + extra)[:n]
    if not picked:
        return ''
    cards = []
    for x in picked:
        short = is_short(x)
        first, *rest = thumbs(x['id'], short)
        when = '' if public(x) else f'<span class="watch-card-soon">Coming {esc(nice_date(x["published"]))}</span>'
        topic = f'<span class="watch-card-topic">{esc(x["topic"])}</span>' if x.get('topic') else ''
        short_cls = ' watch-card--short' if short else ''
        cards.append(
            f'<a class="watch-card{short_cls}" href="/watch/{slugs[x["id"]]}/">'
            f'<span class="watch-thumb"><img src="{first}" data-fallbacks="{" ".join(rest)}" alt="" loading="lazy" decoding="async">'
            f'<i class="ri-play-fill" aria-hidden="true"></i></span>'
            f'<span class="watch-card-body">{topic}'
            f'<span class="watch-card-title">{esc(x["title"])}</span>{when}</span></a>')
    head = f'More from {esc(SERIES[v["section"]][0])}' if v.get('section') in SERIES else 'More videos'
    return (f'<section class="watch-related" aria-labelledby="watch-related-title"><div class="paper-wrap">'
            f'<h2 id="watch-related-title">{head}</h2><div class="watch-grid">{"".join(cards)}</div>'
            f'<p class="watch-all"><a href="/videos.html"><i class="ri-arrow-right-line" aria-hidden="true"></i>All {len(videos)} videos</a></p>'
            f'</div></section>')


def series_nav(v, videos, slugs):
    if v.get('section') not in SERIES or not v.get('episode'):
        return ''
    eps = {x.get('episode'): x for x in videos if x.get('section') == v['section'] and x.get('id') in slugs}
    prev, nxt = eps.get(v['episode'] - 1), eps.get(v['episode'] + 1)
    parts = []
    if prev:
        parts.append(f'<a class="watch-ep watch-ep--prev" href="/watch/{slugs[prev["id"]]}/"><i class="ri-arrow-left-s-line" aria-hidden="true"></i>'
                     f'<span><small>Previous episode</small>{esc(prev["title"])}</span></a>')
    if nxt:
        parts.append(f'<a class="watch-ep watch-ep--next" href="/watch/{slugs[nxt["id"]]}/"><span><small>Next episode</small>{esc(nxt["title"])}</span>'
                     f'<i class="ri-arrow-right-s-line" aria-hidden="true"></i></a>')
    return f'<nav class="watch-series" aria-label="Episodes">{"".join(parts)}</nav>' if parts else ''


def build_page(v, videos, by_id, slugs, pages, today, template):
    slug = slugs[v['id']]
    url = f'{SITE}/watch/{slug}/'
    public = day(v['published']) <= today
    short = is_short(v)
    vld = video_ld(v, url, pages)
    cld = crumbs_ld(v, url)
    group, group_url = group_of(v)
    site_page, outside = paper_link(v, pages)
    paper = v.get('paper') or {}

    kicker = [f'<span class="watch-tag">{esc(group)}</span>',
              f'<span><i class="ri-{"smartphone" if short else "film"}-line" aria-hidden="true"></i>{"Short" if short else "Video"} · {esc(v["duration"])}</span>',
              f'<span>{"Published" if public else "Coming"} {esc(nice_date(v["published"]))}</span>']
    if paper.get('title'):
        cite = f'<a href="{esc(site_page)}">{esc(paper["title"])}</a>' if site_page else esc(paper['title'])
        paper_html = (f'<div class="watch-paper"><p class="watch-paper-label"><i class="ri-article-line" aria-hidden="true"></i>Based on the paper</p>'
                      f'<p class="watch-paper-title">{cite}</p>' + (f'<p class="watch-paper-venue">{esc(paper["venue"])}</p>' if paper.get('venue') else '') + '</div>')
    elif v.get('note'):
        paper_html = f'<p class="watch-note"><i class="ri-lightbulb-flash-line" aria-hidden="true"></i>{esc(v["note"])}</p>'
    else:
        paper_html = ''
    actions = []
    if site_page:
        actions.append(f'<a class="paper-btn paper-btn-primary" href="{esc(site_page)}"><i class="ri-article-line" aria-hidden="true"></i>Read the paper</a>')
    elif outside:
        actions.append(f'<a class="paper-btn paper-btn-primary" href="{esc(outside)}" target="_blank" rel="noopener"><i class="ri-article-line" aria-hidden="true"></i>Read the paper</a>')
    actions.append(f'<a class="paper-btn" href="{esc(youtube_url(v))}" target="_blank" rel="noopener"><i class="ri-youtube-line" aria-hidden="true"></i>Watch on YouTube</a>')
    actions.append(f'<a class="paper-btn" href="{esc(group_url)}"><i class="ri-play-list-2-line" aria-hidden="true"></i>{"All episodes" if v.get("section") in SERIES else "More on " + esc(group)}</a>')

    og_video = ''
    if public:
        og_video = (f'      <meta property="og:video" content="https://www.youtube.com/embed/{v["id"]}">\n'
                    f'      <meta property="og:video:type" content="text/html">\n')
    if public:
        jsonld, pending = indent_json([vld, cld]), ''
    else:
        jsonld = indent_json(cld)
        pending = ('      <script type="application/json" id="watch-video-data">\n' + indent_json(vld) + '\n      </script>\n')
    title_text = v['title']
    return Template(template).substitute(
        page_title=esc(f'{title_text} | ACML Videos'),
        og_title=esc(title_text),
        description=esc(clip(v.get('summary') or title_text)),
        url=url,
        og_image=f'{url}share.jpg',
        og_video=og_video,
        jsonld=jsonld,
        pending_jsonld=pending,
        crumb_url=esc(group_url), crumb_name=esc(group),
        layout_class=' is-short' if short else ' is-wide',
        player=player_html(v, public),
        kicker=''.join(kicker),
        title=esc(title_text),
        summary=f'<p class="watch-summary">{esc(v["summary"])}</p>' if v.get('summary') else '',
        paper=paper_html,
        actions='\n            '.join(actions),
        series_nav=series_nav(v, videos, slugs),
        related=related_cards(v, videos, by_id, slugs, today),
    )


def sitemap_xml(videos, slugs, today):
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<!-- Made by tools/build_watch_pages.py: one entry per watch page; videos already public carry video details. -->',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">']
    for v in videos:
        if v['id'] not in slugs:
            continue
        url = f'{SITE}/watch/{slugs[v["id"]]}/'
        out.append('  <url>')
        out.append(f'    <loc>{esc(url)}</loc>')
        if day(v['published']) <= today:
            out.append(f'    <lastmod>{v["published"]}</lastmod>')
            out.append('    <video:video>')
            out.append(f'      <video:thumbnail_loc>{thumbs(v["id"], is_short(v))[0 if is_short(v) else 1]}</video:thumbnail_loc>')
            out.append(f'      <video:title>{esc(v["title"])}</video:title>')
            out.append(f'      <video:description>{esc(clip(v.get("summary") or v["title"], 2000))}</video:description>')
            out.append(f'      <video:player_loc>https://www.youtube.com/embed/{v["id"]}</video:player_loc>')
            out.append(f'      <video:duration>{seconds(v["duration"])}</video:duration>')
            out.append(f'      <video:publication_date>{v["published"]}</video:publication_date>')
            out.append('      <video:family_friendly>yes</video:family_friendly>')
            out.append('    </video:video>')
        out.append('  </url>')
    out.append('</urlset>')
    return '\n'.join(out) + '\n'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--today', default=dt.date.today().isoformat())
    ap.add_argument('--prune', action='store_true', help='delete watch pages of videos no longer in videos.json')
    args = ap.parse_args()
    today = args.today

    videos = [v for v in read_json(ROOT / 'data' / 'videos.json').get('videos', []) if v.get('id')]
    pages = {}
    for p in read_json(ROOT / 'data' / 'paper-pages.json').get('pages', []):
        for k in ('title', 'name'):
            if p.get(k):
                pages[norm(p[k])] = p
    old = {}
    if PAGES_JSON.exists():
        old = {p['id']: p['slug'] for p in read_json(PAGES_JSON).get('pages', [])}

    missing = [v['id'] for v in videos if not (v.get('published') and v.get('duration'))]
    usable = [v for v in videos if v['id'] not in missing]
    slugs, used = {}, set(old.values())
    for v in usable:                                    # keep the slugs pages already have
        if v['id'] in old:
            slugs[v['id']] = old[v['id']]
    for v in usable:
        if v['id'] in slugs:
            continue
        base = slugify((SERIES[v['section']][0] + ' ' if v.get('section') in SERIES else '') + v['title'])
        slug, k = base, 2
        while slug in used:
            slug, k = f'{base}-{k}', k + 1
        slugs[v['id']] = slug
        used.add(slug)

    template = TEMPLATE.read_text(encoding='utf-8')
    by_id = {v['id']: v for v in usable}
    written = 0
    for v in usable:
        html_text = build_page(v, usable, by_id, slugs, pages, today, template)
        f = OUT_DIR / slugs[v['id']] / 'index.html'
        f.parent.mkdir(parents=True, exist_ok=True)
        if not f.exists() or f.read_text(encoding='utf-8') != html_text:
            f.write_text(html_text, encoding='utf-8')
            written += 1
        card = f.parent / 'share.jpg'
        if share_cards.stale(card):
            group = group_of(v)[0]
            share_cards.make_card(card, v['title'], f'Video · {group}', 'video', subtitle=v.get('summary'),
                                  badge=f'{"Short" if is_short(v) else "Video"} · {v["duration"]}')

    stale = [d for d in OUT_DIR.iterdir() if d.is_dir() and d.name not in set(slugs.values())] if OUT_DIR.exists() else []
    for d in stale:
        idx = d / 'index.html'
        if args.prune and idx.exists() and MARK in idx.read_text(encoding='utf-8'):
            idx.unlink()
            d.rmdir()

    PAGES_JSON.write_text(json.dumps({
        '_readme': f'{MARK}: the watch page of each video in data/videos.json (js/videos.js links the cards on videos.html to them). '
                   'Slugs here are kept on rebuild, so page addresses stay the same when a title changes.',
        'pages': [{'id': v['id'], 'slug': slugs[v['id']], 'url': f'watch/{slugs[v["id"]]}/', 'published': v['published']} for v in usable],
    }, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    SITEMAP.write_text(sitemap_xml(usable, slugs, today), encoding='utf-8')

    robots = ROOT / 'robots.txt'
    line = f'Sitemap: {SITE}/sitemap-videos.xml'
    text = robots.read_text(encoding='utf-8') if robots.exists() else 'User-agent: *\nAllow: /\n'
    if line not in text:
        lines = text.splitlines()
        at = max([i for i, l in enumerate(lines) if l.startswith('Sitemap:')], default=-1) + 1
        lines.insert(at, line)
        robots.write_text('\n'.join(lines) + '\n', encoding='utf-8')

    n_public = sum(1 for v in usable if day(v['published']) <= today)
    print(f'{len(usable)} watch pages ({n_public} public as of {today}, {len(usable) - n_public} scheduled), {written} written; '
          f'data/watch-pages.json, sitemap-videos.xml and robots.txt updated.')
    if missing:
        print('No page (add "published" and "duration" in data/videos.json):', ', '.join(missing))
    if stale:
        print(('Removed' if args.prune else 'Not in videos.json any more (run with --prune to delete):'), ', '.join(d.name for d in stale))


if __name__ == '__main__':
    main()
