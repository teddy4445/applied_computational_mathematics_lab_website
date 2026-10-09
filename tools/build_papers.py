#!/usr/bin/env python3
"""Build the web page of every paper that has a publications/<slug>/ folder.

    python tools/build_papers.py            (pip install markdown pillow)

For each publications/<slug>/paper.md + paper.json it writes publications/<slug>/index.html from
tools/templates/paper.html, plus:
    figures/share-<figure>.jpg   social-preview image made from the featured figure
    data/paper-pages.json        which papers have a page (the Publications list links to them)
    sitemap.xml, llms.txt        the paper pages, between the "paper pages" markers
It never changes paper.md / paper.json, so hand edits there are safe. Run it again after any edit.
"""
import datetime as dt
import html
import json
import re
import string
import sys
import unicodedata
from pathlib import Path

import markdown
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://acml.teddylazebnik.com'
TEMPLATE = ROOT / 'tools' / 'templates' / 'paper.html'
MARK_START, MARK_END = 'paper pages: start (made by tools/build_papers.py)', 'paper pages: end'


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def norm(text):
    text = unicodedata.normalize('NFKD', str(text or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '', text)


def esc(text):
    return html.escape(str(text or ''), quote=True)


def human_date(iso):
    try:
        d = dt.date.fromisoformat(iso)
        return f'{d.day} {d.strftime("%B")} {d.year}'
    except (TypeError, ValueError):
        return iso or ''


def clip(text, n=158):
    text = re.sub(r'\s+', ' ', text or '').strip()
    return text if len(text) <= n else text[:n].rsplit(' ', 1)[0].rstrip(',;:') + '…'


# ---------------------------------------------------------------- body html
def render_body(md_text):
    md = markdown.Markdown(extensions=['extra', 'sane_lists', 'toc'], extension_configs={'toc': {'toc_depth': '2-3'}},
                           output_format='html')
    body = md.convert(md_text)
    return body, md.toc_tokens


def link_body(body, n_refs, ids):
    """Citations [3], [2–5], [4,5,17] -> links to the reference list; 'Fig 2' / 'Table 1' -> links to them;
    reference list items get ids; external links open in a new tab."""
    parts = re.split(r'(<[^>]+>)', body)
    in_a = in_cap = in_refs = 0
    seen_refs_heading = False
    out = []

    def cite(m):
        nums = re.split(r'(\s*[–,-]\s*)', m.group(1))
        if not all(x.strip().isdigit() and 1 <= int(x) <= n_refs for x in nums[::2]):
            return m.group(0)
        linked = ''.join(f'<a href="#ref-{x.strip()}">{x.strip()}</a>' if i % 2 == 0 else x for i, x in enumerate(nums))
        return f'<span class="cite">[{linked}]</span>'

    def fig(m):
        kind = 'table' if m.group(1).lower().startswith('table') else 'fig'
        target = f'{kind}-{m.group(2)}'
        return f'<a class="xref" href="#{target}">{m.group(0)}</a>' if target in ids else m.group(0)

    for part in parts:
        if part.startswith('<'):
            tag = part.lower()
            if tag.startswith('<a ') or tag == '<a>':
                in_a += 1
            elif tag == '</a>':
                in_a -= 1
            elif tag.startswith('<figcaption'):
                in_cap += 1
            elif tag == '</figcaption>':
                in_cap -= 1
            elif tag.startswith('<h2') and 'id="references"' in tag:
                seen_refs_heading = True
            elif tag.startswith('<ol') and seen_refs_heading and not in_refs:
                in_refs = 1
                part = '<ol class="paper-refs">'
            elif tag == '</ol>' and in_refs:
                in_refs = 0
                seen_refs_heading = False
            out.append(part)
            continue
        if not in_a and not in_refs and n_refs:
            part = re.sub(r'\[(\d+(?:\s*[–,-]\s*\d+)*)\]', cite, part)
        if not in_a and not in_cap and not in_refs:
            part = re.sub(r'\b(Fig\.?|Figure|Table)\s?(\d+)\b', fig, part)
        out.append(part)
    body = ''.join(out)

    counter = iter(range(1, 10000))
    body = re.sub(r'<ol class="paper-refs">(.*?)</ol>',
                  lambda m: '<ol class="paper-refs">' + re.sub(r'<li>', lambda _: f'<li id="ref-{next(counter)}">', m.group(1)) + '</ol>',
                  body, flags=re.S)
    body = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener"', body)
    # figures open full size
    body = re.sub(r'(<figure id="fig-\d+">\s*)(<img src="([^"]+)"[^>]*>)', r'\1<a class="fig-zoom" href="\3" aria-label="Open the figure full size">\2</a>', body)
    return body


def toc_html(tokens, extra_after=()):
    items = ['<li><a href="#abstract">Abstract</a></li>']
    for t in tokens:
        if t['id'] == 'references':
            continue
        sub = ''.join(f'<li class="toc-sub"><a href="#{c["id"]}">{esc(c["name"])}</a></li>' for c in t.get('children', []))
        items.append(f'<li><a href="#{t["id"]}">{esc(t["name"])}</a></li>{sub}')
    items.extend(extra_after)
    if any(t['id'] == 'references' for t in tokens):
        items.append('<li><a href="#references">References</a></li>')
    return '\n'.join(items)


# ---------------------------------------------------------------- page parts
def lab_index():
    lab = read_json(ROOT / 'data' / 'lab.json')
    members = lab if isinstance(lab, list) else next(v for v in lab.values() if isinstance(v, list))
    out = {}
    for m in members:
        name = re.sub(r'^(Prof\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s+', '', m.get('name', '').strip())
        out[norm(name)] = m
    return out


def share_image(folder, fig):
    src = folder / 'figures' / f'{fig}.webp'
    if not src.exists():
        return ''
    dst = folder / 'figures' / f'share-{fig}.jpg'
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        im = Image.open(src).convert('RGB')
        canvas = Image.new('RGB', (1200, 630), 'white')         # the size social sites expect
        im.thumbnail((1140, 590))
        canvas.paste(im, ((1200 - im.width) // 2, (630 - im.height) // 2))
        canvas.save(dst, 'JPEG', quality=85, optimize=True)
    return f'figures/{dst.name}'


def citation_texts(meta, year):
    a = meta['authors']
    def initials(given):
        return ' '.join(p[0] + '.' for p in re.split(r'[\s-]+', given) if p)
    names = [f'{x["family"]}, {initials(x.get("given", ""))}'.strip(', ') for x in a]
    apa_names = names[0] if len(names) == 1 else ', '.join(names[:-1]) + ', & ' + names[-1]
    vol = meta.get('volume', '')
    issue = f'({meta["issue"]})' if meta.get('issue') else ''
    pages = f', {meta["pages"]}' if meta.get('pages') else ''
    apa = (f'{apa_names} ({year}). {meta["title"]}. {meta.get("journal", "")}'
           f'{", " + vol + issue if vol else ""}{pages}. https://doi.org/{meta["doi"]}')
    key = norm(a[0]['family']) + str(year) + (re.findall(r'[a-z]+', meta['title'].lower()) or ['paper'])[0]
    bib = ['@article{' + key + ',', f'  title = {{{meta["title"]}}},',
           '  author = {' + ' and '.join(f'{x["family"]}, {x.get("given", "")}'.strip(', ') for x in a) + '},',
           f'  journal = {{{meta.get("journal", "")}}},']
    for k, v in (('volume', vol), ('number', meta.get('issue')), ('pages', meta.get('pages')), ('year', year), ('doi', meta.get('doi'))):
        if v:
            bib.append(f'  {k} = {{{v}}},')
    bib[-1] = bib[-1].rstrip(',')
    return apa, '\n'.join(bib) + '\n}'


def build_one(folder, pub, pubs, pages_index, lab, videos, projects, template):
    meta = read_json(folder / 'paper.json')
    slug = folder.name
    url = f'{SITE}/publications/{slug}/'
    title = meta.get('title') or pub['name']
    year = (meta.get('published') or str(pub.get('year', '')))[:4]
    topic = pub.get('topic', '')

    body_md = (folder / 'paper.md').read_text(encoding='utf-8')
    body, tokens = render_body(body_md)
    ids = set(re.findall(r'id="([^"]+)"', body))
    n_refs = len(re.findall(r'^\d+\.\s', body_md.split('## References', 1)[-1], re.M)) if '## References' in body_md else 0
    body = link_body(body, n_refs, ids)

    # authors
    affs = meta.get('affiliations', {})
    author_bits, lab_chips = [], []
    for a in meta['authors']:
        sup = ','.join(str(x) for x in a.get('affiliations', []))
        member = lab.get(norm(a['name']))
        name = esc(a['name'])
        if member:
            name = f'<a class="is-lab" href="/team.html" title="ACML team member">{name}</a>'
            role = 'Alumni' if 'alumni' in (member.get('category_name') or '').lower() else member.get('title', '')
            lab_chips.append(f'<a class="lab-chip" href="/team.html"><img src="/{esc(member.get("image_link") or "img/lab/user.webp")}" '
                             f'alt="" width="32" height="32" loading="lazy"><span><strong>{esc(a["name"])}</strong>'
                             f'<small>{esc(role)}</small></span></a>')
        mark = '<span class="corr" title="Corresponding author">*</span>' if a.get('corresponding') else ''
        author_bits.append(f'<span class="author">{name}<sup>{esc(sup)}</sup>{mark}</span>')
    authors_html = ', '.join(author_bits)
    affs_html = ''.join(f'<li value="{esc(k)}">{esc(v)}</li>' for k, v in sorted(affs.items(), key=lambda kv: int(kv[0])))

    # at a glance
    glance = ''
    if meta.get('summary'):
        nums = ''.join(f'<div class="stat"><span class="stat-value">{esc(x["value"])}</span><span class="stat-label">{esc(x["label"])}</span></div>'
                       for x in meta.get('key_numbers', []))
        finds = ''.join(f'<li>{esc(x)}</li>' for x in meta.get('key_findings', []))
        feat = ''
        fig = meta.get('featured_figure')
        if fig and (folder / 'figures' / f'{fig}.webp').exists():
            cap = re.search(rf'<figure id="{fig}">.*?<figcaption>(.*?)</figcaption>', body, re.S)
            w, h = Image.open(folder / 'figures' / f'{fig}.webp').size
            feat = (f'<figure class="glance-figure"><a href="#{fig}"><img src="figures/{fig}.webp" width="{w}" height="{h}" '
                    f'alt="{esc(re.sub("<[^>]+>", "", cap.group(1)) if cap else "")}"></a>'
                    f'<figcaption>{cap.group(1) if cap else ""} <a href="#{fig}">See it in the paper</a></figcaption></figure>')
        glance = (f'<section class="paper-glance" aria-labelledby="glance-title"><div class="paper-wrap"><div class="glance-card">'
                  f'<div class="glance-text"><h2 id="glance-title" class="glance-label"><i class="ri-lightbulb-flash-line" aria-hidden="true"></i>The paper at a glance</h2>'
                  f'<p class="glance-summary">{esc(meta["summary"])}</p>'
                  f'{"<div class=glance-stats>" + nums + "</div>" if nums else ""}'
                  f'{"<h3 class=glance-sub>Key findings</h3><ul class=glance-findings>" + finds + "</ul>" if finds else ""}</div>'
                  f'{feat}</div></div></section>')

    # article information
    lic = meta.get('license') or {}
    where = esc(meta.get('journal') or pub.get('publisher', ''))
    if meta.get('volume'):
        where += f' {esc(meta["volume"])}' + (f'({esc(meta["issue"])})' if meta.get('issue') else '') + (f': {esc(meta["pages"])}' if meta.get('pages') else '')
    info_rows = [('Journal', where)]
    if meta.get('published'):
        info_rows.append(('Published', f'<time datetime="{esc(meta["published"])}">{human_date(meta["published"])}</time>'))
    if meta.get('doi'):
        info_rows.append(('DOI', f'<a href="https://doi.org/{esc(meta["doi"])}" target="_blank" rel="noopener">{esc(meta["doi"])}</a>'))
    if lic.get('url'):
        info_rows.append(('Licence', f'<a href="{esc(lic["url"])}" target="_blank" rel="license noopener">{esc(lic.get("name") or "Open licence")}</a>'))
    history = ' · '.join(f'{k} {human_date(meta[f])}' for k, f in (('Received', 'received'), ('Accepted', 'accepted'), ('Published', 'published')) if meta.get(f))
    info_html = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in info_rows)

    # notes after the paper
    notes = []
    if history:
        notes.append(f'<div><dt>Publication history</dt><dd>{history}</dd></div>')
    for key, label in (('funding', 'Funding'), ('competing_interests', 'Competing interests'), ('data_availability', 'Data availability')):
        if meta.get(key):
            notes.append(f'<div><dt>{label}</dt><dd>{esc(meta[key])}</dd></div>')
    if meta.get('abbreviations'):
        ab = ''.join(f'<li><abbr>{esc(a)}</abbr> {esc(b)}</li>' for a, b in meta['abbreviations'])
        notes.append(f'<div><dt>Abbreviations</dt><dd><ul class="abbr-list">{ab}</ul></dd></div>')
    notes_html = f'<section id="article-notes" class="paper-notes"><h2>Article notes</h2><dl>{"".join(notes)}</dl></section>' if notes else ''

    source_html = ''
    if lic.get('url'):
        source_html = (f'<p class="paper-source"><i class="ri-information-line" aria-hidden="true"></i> This page reproduces the article '
                       f'{esc(meta["authors"][0]["family"])} et al. ({year}), <em>{esc(meta.get("journal", ""))}</em>, '
                       f'<a href="https://doi.org/{esc(meta["doi"])}" target="_blank" rel="noopener">doi:{esc(meta["doi"])}</a>, under the '
                       f'<a href="{esc(lic["url"])}" target="_blank" rel="license noopener">{esc(lic.get("name") or "open licence")}</a> licence. '
                       f'Layout adapted for the web; the PDF is the version of record.</p>')

    # related: video, project, papers
    related = []
    vid = next((v for v in videos if norm((v.get('paper') or {}).get('title')) == norm(pub['name'])), None)
    video_btn = video_html = ''
    if vid:
        short = vid.get('format') == 'short'
        thumb = f'https://i.ytimg.com/vi/{vid["id"]}/{"sddefault" if short else "maxresdefault"}.jpg'
        watch = f'https://www.youtube.com/{"shorts/" + vid["id"] if short else "watch?v=" + vid["id"]}'
        video_html = (f'<section id="video" class="paper-video"><h2>Watch the explainer</h2><div class="yt-player {"yt-9x16" if short else "yt-16x9"}" '
                      f'data-yt-id="{esc(vid["id"])}" data-yt-title="{esc(vid["title"])}"><a class="yt-play" href="{watch}" aria-label="Play video: {esc(vid["title"])}">'
                      f'<img src="{thumb}" data-yt-fallbacks="https://i.ytimg.com/vi/{esc(vid["id"])}/hqdefault.jpg" alt="" loading="lazy" decoding="async">'
                      f'<span class="yt-play-icon" aria-hidden="true"><i class="ri-play-fill"></i></span></a></div></section>')
        video_btn = '<a class="paper-btn" href="#video"><i class="ri-play-circle-line" aria-hidden="true"></i>Video</a>'
    proj = next((p for p in projects if p.get('slug') == meta.get('related_project')), None)
    if proj:
        summary = proj.get('summary') or proj.get('subtitle') or proj.get('description') or ''
        img = f'<img src="/{esc(proj["image"])}" alt="" loading="lazy" decoding="async">' if proj.get('image') else ''
        related.append(f'<a class="related-card related-project" href="/project.html?pagename={esc(proj["slug"])}">{img}'
                       f'<span class="related-kind"><i class="ri-flask-line" aria-hidden="true"></i>Research project</span>'
                       f'<strong>{esc(proj.get("title", ""))}</strong><span class="related-text">{esc(clip(re.sub("<[^>]+>", "", summary), 170))}</span></a>')
    mine = {norm(a['name']) for a in meta['authors']} - {norm('Teddy Lazebnik')}
    scored = []
    for p in pubs:
        if norm(p['name']) == norm(pub['name']):
            continue
        theirs = {norm(x) for x in re.split(r',\s*', p.get('authors', ''))}
        score = 3 * len(mine & theirs) + (1 if p.get('topic') == topic else 0)
        if score >= 3:
            scored.append((score, p.get('year', 0), p))
    for _, _, p in sorted(scored, key=lambda x: (-x[0], -x[1]))[:3 - len(related)]:
        page = pages_index.get(norm(p['name']))
        pdf = next((l['link'] for l in p.get('fileLinks', []) if l.get('type') == 1), '')
        href = f'/{page}' if page else (('https://teddylazebnik.com' + pdf) if pdf.startswith('/') else pdf)
        kind = 'Paper' if page else 'Paper (PDF)'
        related.append(f'<a class="related-card" href="{esc(href)}"{"" if page else " target=_blank rel=noopener"}>'
                       f'<span class="related-kind"><i class="ri-article-line" aria-hidden="true"></i>{kind} · {esc(p.get("year", ""))}</span>'
                       f'<strong>{esc(p["name"])}</strong><span class="related-text">{esc(p.get("publisher", ""))}</span></a>')
    related_html = (f'<section class="paper-related" aria-labelledby="related-title"><div class="paper-wrap"><h2 id="related-title">Related research</h2>'
                    f'<div class="related-grid">{"".join(related)}</div><p class="related-more"><a href="/publications.html">All publications</a></p></div></section>') if related else ''

    # search-engine data
    share = share_image(folder, meta.get('featured_figure') or 'fig-1')
    share_url = f'{url}{share}' if share else f'{SITE}/img/logo.png'
    pdf_url = f'{url}{meta["pdf"]}'
    desc = clip(meta.get('summary') or meta.get('abstract') or '')
    cm = [('citation_title', title)]
    for a in meta['authors']:
        cm.append(('citation_author', a['name']))
        for k in a.get('affiliations', []):
            if str(k) in affs:
                cm.append(('citation_author_institution', affs[str(k)]))
    pub_date = (meta.get('published') or year).replace('-', '/')
    cm += [('citation_publication_date', pub_date), ('citation_journal_title', meta.get('journal', '')),
           ('citation_volume', meta.get('volume', '')), ('citation_issue', meta.get('issue', '')),
           ('citation_firstpage', (meta.get('pages') or '').split('–')[0].split('-')[0]), ('citation_doi', meta.get('doi', '')),
           ('citation_pdf_url', pdf_url), ('citation_abstract_html_url', url), ('citation_fulltext_html_url', url),
           ('citation_language', 'en')]
    citation_meta = '\n      '.join(f'<meta name="{k}" content="{esc(v)}">' for k, v in cm if v)
    jsonld = {
        '@context': 'https://schema.org', '@type': 'ScholarlyArticle', 'headline': clip(title, 110), 'name': title,
        'author': [dict({'@type': 'Person', 'name': a['name']},
                        **({'affiliation': [{'@type': 'Organization', 'name': affs[str(k)]} for k in a.get('affiliations', []) if str(k) in affs]}
                           if a.get('affiliations') else {})) for a in meta['authors']],
        'datePublished': meta.get('published') or year, 'url': url, 'mainEntityOfPage': url,
        'abstract': meta.get('abstract', ''), 'description': desc, 'image': share_url,
        'identifier': {'@type': 'PropertyValue', 'propertyID': 'DOI', 'value': meta.get('doi', '')},
        'sameAs': f'https://doi.org/{meta["doi"]}' if meta.get('doi') else None,
        'isPartOf': {'@type': 'Periodical', 'name': meta.get('journal', '')},
        'about': topic or None, 'isAccessibleForFree': True,
        'license': lic.get('url') or None,
        'encoding': {'@type': 'MediaObject', 'contentUrl': pdf_url, 'encodingFormat': 'application/pdf'},
        'publisher': {'@type': 'Organization', 'name': 'Applied Computational Mathematics Laboratory', 'url': SITE + '/'},
    }
    jsonld = {k: v for k, v in jsonld.items() if v}
    if meta.get('volume'):
        jsonld['isPartOf'] = {'@type': 'PublicationIssue', 'issueNumber': meta.get('issue', ''),
                              'isPartOf': {'@type': 'PublicationVolume', 'volumeNumber': meta['volume'],
                                           'isPartOf': {'@type': 'Periodical', 'name': meta.get('journal', '')}}}
    apa, bib = citation_texts(meta, year)
    has_math = bool(re.search(r'\$\$|\\\(|\\\[', body_md))
    math_head = ('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">\n'
                 '      <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>\n'
                 '      <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js" '
                 'onload="renderMathInElement(document.getElementById(\'full-text\'))"></script>') if has_math else ''

    extra_toc = []
    if notes_html:
        extra_toc.append('<li><a href="#article-notes">Article notes</a></li>')
        if '<h2 id="references">' in body:
            body = body.replace('<h2 id="references">', notes_html + '\n<h2 id="references">', 1)
            notes_html = ''
    values = {
        'page_title': esc(clip(meta.get('short_title') or title, 90)) + ' | ACML',
        'description': esc(desc), 'url': url, 'share_url': esc(share_url), 'og_title': esc(meta.get('short_title') or title),
        'authors_plain': esc(', '.join(a['name'] for a in meta['authors'])),
        'citation_meta': citation_meta,
        'jsonld': json.dumps(jsonld, ensure_ascii=False, indent=2).replace('</', '<\\/'),
        'math_head': math_head, 'videos_css': '<link href="/css/videos.css" rel="stylesheet">' if vid else '',
        'videos_js': '<script src="/js/videos.js"></script>' if vid else '',
        'topic': esc(topic or 'Publications'), 'topic_q': esc(topic),
        'kicker': ' · '.join(x for x in [esc(meta.get('article_type', '')), f'<em>{esc(meta.get("journal", ""))}</em>' if meta.get('journal') else '',
                                         human_date(meta.get('published')) or esc(year)] if x),
        'oa_badge': '<span class="oa-badge"><i class="ri-lock-unlock-line" aria-hidden="true"></i>Open access</span>' if lic.get('url') else '',
        'title': esc(title), 'title_class': ' is-long' if len(title) > 120 else '', 'authors_html': authors_html, 'affiliations_html': affs_html,
        'pdf': esc(meta['pdf']), 'doi': esc(meta.get('doi', '')), 'video_button': video_btn,
        'lab_authors': (f'<div class="lab-authors"><span class="lab-authors-label">ACML authors</span>{"".join(lab_chips)}</div>') if lab_chips else '',
        'glance': glance, 'toc': toc_html(tokens, extra_toc), 'info': info_html,
        'abstract': esc(meta.get('abstract', '')), 'body': body, 'notes': notes_html, 'source': source_html,
        'video_section': video_html, 'related': related_html,
        'apa': esc(apa), 'bibtex': esc(bib),
    }
    page = string.Template(template.read_text(encoding='utf-8')).substitute(values)
    out = folder / 'index.html'
    changed = not out.exists() or out.read_text(encoding='utf-8') != page
    if changed:
        out.write_text(page, encoding='utf-8')
    return {'title': pub['name'], 'slug': slug, 'url': f'publications/{slug}/', 'doi': meta.get('doi', ''),
            'summary': desc, 'changed': changed}


# ---------------------------------------------------------------- site files
def replace_block(text, start_line, end_line, new_lines):
    """Replace the lines between two marker lines (added before `anchor` the first time)."""
    if start_line in text:
        a = text.index(start_line)
        a = text.rfind('\n', 0, a) + 1
        b = text.index(end_line, a)
        b = text.find('\n', b) + 1
        return text[:a] + new_lines + text[b:]
    return None


def update_sitemap(pages, today):
    path = ROOT / 'sitemap.xml'
    raw = path.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw.decode('utf-8-sig')
    eol = '\r\n' if '\r\n' in text else '\n'
    old = dict(re.findall(r'<loc>(.*?)</loc>\s*<lastmod>(.*?)</lastmod>', text))
    lines = [f'  <!-- {MARK_START} -->']
    for p in pages:
        loc = f'{SITE}/{p["url"]}'
        lastmod = old.get(loc) if not p['changed'] and old.get(loc) else f'{today}T00:00:00.000Z'
        lines += ['  <url>', f'    <loc>{loc}</loc>', f'    <lastmod>{lastmod}</lastmod>', '    <priority>0.70</priority>', '  </url>']
    lines.append(f'  <!-- {MARK_END} -->')
    block = eol.join(lines) + eol
    new = replace_block(text, MARK_START, MARK_END, block)
    if new is None:
        i = text.index('</urlset>')
        new = text[:i] + block + text[i:]
    path.write_bytes((b'\xef\xbb\xbf' if bom else b'') + new.encode('utf-8'))


def update_llms(pages):
    path = ROOT / 'llms.txt'
    if not path.exists():
        return
    raw = path.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw.decode('utf-8-sig')
    eol = '\r\n' if '\r\n' in text else '\n'
    lines = [f'<!-- {MARK_START} -->', '## Paper pages (full text, open access)', '']
    lines += [f'- [{p["title"]}]({SITE}/{p["url"]}): {p["summary"]}' for p in pages]
    lines += ['', f'<!-- {MARK_END} -->']
    block = eol.join(lines) + eol
    new = replace_block(text, MARK_START, MARK_END, block)
    if new is None:
        new = text.rstrip() + eol + eol + block
    path.write_bytes((b'\xef\xbb\xbf' if bom else b'') + new.encode('utf-8'))


def main():
    pubs = read_json(ROOT / 'data' / 'academic-publications.json')['publications']
    by_title = {norm(p['name']): p for p in pubs}
    lab = lab_index()
    videos = read_json(ROOT / 'data' / 'videos.json').get('videos', []) if (ROOT / 'data' / 'videos.json').exists() else []
    projects = read_json(ROOT / 'data' / 'projects-info.json').get('projects', [])
    folders = sorted(p.parent for p in (ROOT / 'publications').glob('*/paper.json'))
    todo = []
    for folder in folders:
        meta = read_json(folder / 'paper.json')
        pub = by_title.get(norm(meta.get('title')))
        if not pub:
            print(f'! {folder.name}: title not found in data/academic-publications.json - fix "title" in paper.json')
            continue
        todo.append((folder, pub))
    pages_index = {norm(pub['name']): f'publications/{folder.name}/' for folder, pub in todo}
    built = [build_one(folder, pub, pubs, pages_index, lab, videos, projects, TEMPLATE) for folder, pub in todo]
    built.sort(key=lambda p: p['slug'])
    index = [{k: p[k] for k in ('title', 'slug', 'url', 'doi')} for p in built]
    (ROOT / 'data' / 'paper-pages.json').write_text(json.dumps({'_readme': 'Made by tools/build_papers.py: papers that have their own page.',
                                                                'pages': index}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    today = dt.date.today().isoformat()
    update_sitemap(built, today)
    update_llms(built)
    for p in built:
        print(f'{"built " if p["changed"] else "same  "} publications/{p["slug"]}/index.html')
    print(f'{len(built)} paper page(s); data/paper-pages.json, sitemap.xml and llms.txt updated.')


if __name__ == '__main__':
    sys.exit(main())
