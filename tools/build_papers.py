#!/usr/bin/env python3
"""Build the web page of every paper that has a publications/<slug>/ folder.

    python tools/build_papers.py            (pip install markdown pillow)
    python tools/build_papers.py --no-search   (skip the full-text search index)

For each publications/<slug>/paper.md + paper.json it writes publications/<slug>/index.html from
tools/templates/paper.html, plus:
    figures/share-<figure>.jpg   social-preview image made from the featured figure
    data/paper-pages.json        which papers have a page (the Publications list links to them)
    sitemap.xml, llms.txt        the paper pages, between the "paper pages" markers
    pagefind/                    the full-text search index (needs `npm install` once; see update_search_index)
It never changes paper.md / paper.json, so hand edits there are safe. Run it again after any edit.
"""
import collections
import datetime as dt
import html
import json
import math
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
PI = 'teddylazebnik'
STOP = set('''a an the of in on for and to with by using via from as at into its their is are be or we our this that these those was were
has have had not but can may also than which such based between within over under both more most other new two one study model models
results show shows paper approach data analysis method methods use used'''.split())


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


def roman(s):
    vals = {'I': 1, 'V': 5, 'X': 10, 'L': 50}
    total, prev = 0, 0
    for ch in reversed(s.upper()):
        v = vals.get(ch, 0)
        total = total - v if v < prev else total + v
        prev = max(prev, v)
    return total


# ---------------------------------------------------------------- relatedness (TF-IDF, no extra packages)
def words(text):
    return [w for w in re.findall(r'[a-z][a-z-]{2,}', (text or '').lower()) if w not in STOP]


class Similarity:
    def __init__(self, docs):
        self.df = collections.Counter()
        for d in docs:
            self.df.update(set(words(d)))
        self.n = max(1, len(docs))

    def vec(self, text):
        tf = collections.Counter(words(text))
        v = {w: (1 + math.log(c)) * math.log((self.n + 1) / (self.df.get(w, 0) + 1)) for w, c in tf.items()}
        s = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {w: x / s for w, x in v.items()}

    @staticmethod
    def cos(a, b):
        if len(a) > len(b):
            a, b = b, a
        return sum(x * b.get(w, 0.0) for w, x in a.items())


# ---------------------------------------------------------------- body html
def render_body(md_text):
    md = markdown.Markdown(extensions=['extra', 'sane_lists', 'toc'], extension_configs={'toc': {'toc_depth': '2-3'}},
                           output_format='html')
    body = md.convert(md_text)
    return body, md.toc_tokens


def link_body(body, n_refs, ids):
    """Citations [3], [2–5], [4,5,17] and superscript citations -> links to the reference list; 'Fig 2' /
    'Table 1' -> links to them; the reference list gets ids; external links open in a new tab."""
    parts = re.split(r'(<[^>]+>)', body)
    in_a = in_cap = in_refs = in_sup = 0
    seen_refs_heading = False
    out = []

    def nums_ok(seq):
        try:
            return all(x.strip().isdigit() and 1 <= int(x) <= n_refs for x in seq)
        except ValueError:
            return False

    def cite(m):
        nums = re.split(r'(\s*[–,-]\s*)', m.group(1))
        if not nums_ok(nums[::2]):
            return m.group(0)
        linked = ''.join(f'<a href="#ref-{x.strip()}">{x.strip()}</a>' if i % 2 == 0 else x for i, x in enumerate(nums))
        return f'<span class="cite">[{linked}]</span>'

    def fig(m):
        kind = {'tab': 'table', 'alg': 'alg'}.get(m.group(1).lower()[:3], 'fig')
        num = m.group(2)
        n = str(roman(num)) if re.fullmatch(r'[IVXL]+', num) else re.sub(r'[.\-]', '', num).lower()
        target = f'{kind}-{n}'
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
            elif tag == '<sup>':
                in_sup += 1
            elif tag == '</sup>':
                in_sup -= 1
            elif tag.startswith('<h2'):
                seen_refs_heading = 'id="references"' in tag
            elif tag.startswith(('<ol', '<ul')) and seen_refs_heading:
                in_refs += 1
                if in_refs == 1:            # every list under the References heading
                    start = re.search(r'start="\d+"', part)
                    part = part[:3] + ' class="paper-refs"' + (' ' + start.group(0) if start else '') + '>'
            elif tag in ('</ol>', '</ul>') and in_refs:
                in_refs -= 1
            out.append(part)
            continue
        if not in_a and not in_refs and n_refs:
            part = re.sub(r'\[(\d+(?:\s*[–,-]\s*\d+)*)\]', cite, part)
            if in_sup and re.fullmatch(r'\s*\d+(\s*[–,-]\s*\d+)*\s*', part) and nums_ok(re.split(r'\s*[–,-]\s*', part.strip())[::1]):
                seq = re.split(r'(\s*[–,-]\s*)', part.strip())
                part = ''.join(f'<a href="#ref-{x.strip()}">{x.strip()}</a>' if i % 2 == 0 else x for i, x in enumerate(seq))
        if not in_a and not in_cap and not in_refs:
            part = re.sub(r'\b(Figs?\.?|Figures?|Tables?|Tab\.|Algorithms?)\s?([A-Z][.\-]?\d+|\d+|[IVX]+)\b', fig, part)
        out.append(part)
    body = ''.join(out)
    body = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener"', body)
    body = re.sub(r'(<figure id="fig-[\w-]+">\s*)(<img src="([^"]+)"[^>]*>)', r'\1<a class="fig-zoom" href="\3" aria-label="Open the figure full size">\2</a>', body)
    return body


def fix_ref_numbers(body, body_md):
    """Numbered reference lists that do not start at 1 keep their numbers (start=...). Every reference
    gets an id (ref-N) that citations link to."""
    m = re.search(r'^## References\s*\n\s*(\d+)\.', body_md, re.M)
    if m and m.group(1) != '1':
        body = body.replace('<ol class="paper-refs">', f'<ol class="paper-refs" start="{m.group(1)}">', 1)

    nxt = [1]

    def number(m):
        first = int(m.group(2)) if m.group(2) else nxt[0]
        counter = iter(range(first, first + 100000))
        items = re.sub(r'<li>', lambda _: f'<li id="ref-{next(counter)}">', m.group(3))
        nxt[0] = next(counter)
        return m.group(1) + items + m.group(4)
    return re.sub(r'(<(?:ol|ul) class="paper-refs"(?: start="(\d+)")?>)(.*?)(</(?:ol|ul)>)', number, body, flags=re.S)


def ref_key(text):
    """(first author's surname, year) of an author-year reference: 'Lazebnik, T., ... (2023a)' -> ('lazebnik', '2023a')."""
    t = re.sub(r'<[^>]+>', '', html.unescape(text)).strip()
    year = re.search(r'\b((?:19|20)\d{2})([a-z]?)\b', t)
    if not year:
        return None
    first = re.split(r',|\(|\s(?:and|&)\s', t[:year.start()] or t, maxsplit=1)[0].strip()
    words = [w for w in re.findall(r"[^\W\d_][\w'’\-]*", first) if not re.fullmatch(r'[A-Z]{1,3}|[A-Z]\.?', w)]
    if not words:
        return None
    return fold(words[-1]), year.group(1) + year.group(2)


def fold(word):
    return ''.join(c for c in unicodedata.normalize('NFKD', word.lower()) if not unicodedata.combining(c)).replace('’', "'")


def link_author_year(body):
    """Author-year citations ('Smith et al. (2020)', '(Jones & Lee, 2019a)') -> links to the reference list."""
    lst = re.search(r'<ul class="paper-refs">(.*?)</ul>', body, re.S)
    if not lst:
        return body
    keys, seen = {}, collections.Counter()
    for rid, item in re.findall(r'<li id="(ref-\d+)">(.*?)</li>', lst.group(1), re.S):
        k = ref_key(item)
        if k:
            seen[k] += 1
            keys[k] = rid
    keys = {k: v for k, v in keys.items() if seen[k] == 1}      # two references with the same key: leave them alone
    if not keys:
        return body
    name = r"[A-Z][\w'’\-]+"
    cite_re = re.compile(rf"\b({name})((?:\s+et\s+al\.?|\s+(?:and|&|&amp;)\s+(?:[a-z]+\s+)*{name})?)(,?\s*)(\(?)((?:19|20)\d{{2}}[a-z]?)\b")

    def repl(m):
        rid = keys.get((fold(m.group(1)), m.group(5)))
        if not rid:
            return m.group(0)
        if m.group(4):          # narrative: Smith et al. (2020) -> link the year
            return f'{m.group(1)}{m.group(2)}{m.group(3)}{m.group(4)}<a class="cite-ay" href="#{rid}">{m.group(5)}</a>'
        return f'<a class="cite-ay" href="#{rid}">{m.group(0)}</a>'
    head, sep, tail = body.partition('<h2 id="references">')
    parts = re.split(r'(<[^>]+>)', head)
    in_a = 0
    for i, part in enumerate(parts):
        if part.startswith('<'):
            tag = part.lower()
            in_a += 1 if tag.startswith('<a ') or tag == '<a>' else -1 if tag == '</a>' else 0
            continue
        if not in_a and part.strip():
            parts[i] = cite_re.sub(repl, part)
    return ''.join(parts) + sep + tail


def toc_html(tokens, extra_after=(), after_abstract=()):
    items = ['<li><a href="#abstract">Abstract</a></li>', *after_abstract]
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
    if not fig or not src.exists():
        return ''
    dst = folder / 'figures' / f'share-{fig}.jpg'
    for old in (folder / 'figures').glob('share-*.jpg'):     # a social image of another (earlier) figure
        if old != dst:
            old.unlink()
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
    doi = f' https://doi.org/{meta["doi"]}' if meta.get('doi') else ''
    apa = f'{apa_names} ({year}). {meta["title"]}. {meta.get("journal", "")}{", " + vol + issue if vol else ""}{pages}.{doi}'
    key = norm(a[0]['family']) + str(year) + next((w for w in re.findall(r'[a-z]+', meta['title'].lower()) if w not in STOP), 'paper')
    bib = ['@article{' + key + ',', f'  title = {{{meta["title"]}}},',
           '  author = {' + ' and '.join(f'{x["family"]}, {x.get("given", "")}'.strip(', ') for x in a) + '},',
           f'  journal = {{{meta.get("journal", "")}}},']
    for k, v in (('volume', vol), ('number', meta.get('issue')), ('pages', meta.get('pages')), ('year', year), ('doi', meta.get('doi'))):
        if v:
            bib.append(f'  {k} = {{{v}}},')
    bib[-1] = bib[-1].rstrip(',')
    return apa, '\n'.join(bib) + '\n}'


def pick_project(meta, pub, projects, sim, pvecs, slug=''):
    """The research project a paper belongs to: "related_project" in paper.json, else the project whose "papers" list
    in data/projects-info.json has it (the closest by topic when several do). Without such lists: the closest project
    by topic and team."""
    if meta.get('related_project'):
        return next((p for p in projects if p.get('slug') == meta['related_project']), None)
    v = sim.vec(pub['name'] + ' ' + pub.get('description', ''))
    listed = [p for p in projects if slug and slug in p.get('papers', [])]
    if listed:
        return max(listed, key=lambda p: Similarity.cos(v, pvecs[p['slug']]))
    if any('papers' in p for p in projects):        # the projects list their papers: a paper in none of them has no project
        return None
    mine = {norm(a) for a in re.split(r',\s*(?:(?:and|&)\s+)?|\s+(?:and|&)\s+', pub.get('authors', '')) if a.strip()} - {PI}
    best, best_s = None, 0.0
    for p in projects:
        team = {norm(re.sub(r'^(Prof\.|Dr\.)\s+', '', t.get('name', ''))) for t in p.get('team', [])} - {PI}
        s = Similarity.cos(v, pvecs[p['slug']]) + 0.06 * len(mine & team)
        if s > best_s:
            best, best_s = p, s
    return best if best_s >= 0.12 else None


def build_one(folder, pub, ctx):
    pubs, pages_index, lab, videos, projects, template, sim, vecs, pvecs = (ctx[k] for k in
        ('pubs', 'pages_index', 'lab', 'videos', 'projects', 'template', 'sim', 'vecs', 'pvecs'))
    meta = read_json(folder / 'paper.json')
    slug = folder.name
    url = f'{SITE}/publications/{slug}/'
    title = meta.get('title') or pub['name']
    year = (meta.get('published') or str(meta.get('year') or pub.get('year', '')))[:4]
    topic = pub.get('topic', '')
    body_md = (folder / 'paper.md').read_text(encoding='utf-8') if (folder / 'paper.md').exists() else ''
    has_body = bool(body_md.strip())

    body, tokens = render_body(body_md)
    ids = set(re.findall(r'id="([^"]+)"', body))
    refs_part = body_md.split('\n## References', 1)[-1] if '\n## References' in body_md or body_md.startswith('## References') else ''
    n_refs = max([int(x) for x in re.findall(r'^(\d+)\.\s', refs_part, re.M)] or [0])
    body = link_body(body, n_refs, ids)
    body = fix_ref_numbers(body, body_md)
    body = link_author_year(body)

    # authors
    affs = meta.get('affiliations') or {}
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
        author_bits.append(f'<span class="author">{name}' + (f'<sup>{esc(sup)}</sup>' if sup else '') + f'{mark}</span>')
    authors_html = ', '.join(author_bits)
    try:
        aff_items = sorted(affs.items(), key=lambda kv: (0, int(kv[0])) if str(kv[0]).isdigit() else (1, str(kv[0])))
    except AttributeError:
        aff_items = []
    numbered = all(str(k).isdigit() for k, _ in aff_items)
    affs_html = ''.join((f'<li value="{esc(k)}">' if numbered else '<li>') + f'{esc(v)}</li>' for k, v in aff_items)
    affs_block = (f'<details class="paper-affils"><summary>Affiliations</summary><ol{"" if numbered else " class=plain"}>{affs_html}</ol></details>') if aff_items else ''

    # at a glance
    glance = ''
    fig = meta.get('featured_figure')
    if meta.get('summary'):
        nums = ''.join(f'<div class="stat"><span class="stat-value">{esc(x["value"])}</span><span class="stat-label">{esc(x["label"])}</span></div>'
                       for x in meta.get('key_numbers', []))
        finds = ''.join(f'<li>{esc(x)}</li>' for x in meta.get('key_findings', []))
        feat = ''
        if fig and (folder / 'figures' / f'{fig}.webp').exists():
            cap = re.search(rf'<figure id="{re.escape(fig)}">.*?<figcaption>(.*?)</figcaption>', body, re.S)
            w, h = Image.open(folder / 'figures' / f'{fig}.webp').size
            feat = (f'<figure class="glance-figure"><a href="#{fig}"><img src="figures/{fig}.webp" width="{w}" height="{h}" '
                    f'alt="{esc(re.sub("<[^>]+>", "", cap.group(1)) if cap else "")}"></a>'
                    f'<figcaption>{cap.group(1) if cap else ""} <a href="#{fig}">See it in the paper</a></figcaption></figure>')
        glance = (f'<section class="paper-glance" aria-labelledby="glance-title" data-pagefind-body><div class="paper-wrap"><div class="glance-card{"" if feat else " no-figure"}">'
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
    else:
        info_rows.append(('Year', esc(year)))
    if meta.get('doi'):
        info_rows.append(('DOI', f'<a href="https://doi.org/{esc(meta["doi"])}" target="_blank" rel="noopener">{esc(meta["doi"])}</a>'))
    if lic.get('url'):
        info_rows.append(('Licence', f'<a href="{esc(lic["url"])}" target="_blank" rel="license noopener">{esc(lic.get("name") or "Open licence")}</a>'))
    info_html = ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in info_rows)
    history = ' · '.join(f'{k} {human_date(meta[f])}' for k, f in (('Received', 'received'), ('Accepted', 'accepted'), ('Published', 'published')) if meta.get(f))

    notes = []
    if history:
        notes.append(f'<div><dt>Publication history</dt><dd>{history}</dd></div>')
    if meta.get('keywords'):
        notes.append('<div><dt>Keywords</dt><dd><ul class="kw-list">' + ''.join(f'<li>{esc(k)}</li>' for k in meta['keywords']) + '</ul></dd></div>')
    for key, label in (('funding', 'Funding'), ('competing_interests', 'Competing interests'), ('data_availability', 'Data availability')):
        if meta.get(key):
            notes.append(f'<div><dt>{label}</dt><dd>{esc(meta[key])}</dd></div>')
    if meta.get('abbreviations'):
        ab = ''.join(f'<li><abbr>{esc(a)}</abbr> {esc(b)}</li>' for a, b in meta['abbreviations'])
        notes.append(f'<div><dt>Abbreviations</dt><dd><ul class="abbr-list">{ab}</ul></dd></div>')
    notes_html = f'<section id="article-notes" class="paper-notes" data-pagefind-ignore><h2>Article notes</h2><dl>{"".join(notes)}</dl></section>' if notes else ''

    first = esc(meta['authors'][0]['family']) if meta.get('authors') else ''
    cite_short = f'{first}{" et al." if len(meta.get("authors", [])) > 1 else ""} ({esc(year)}), <em>{esc(meta.get("journal", ""))}</em>'
    doi_link = f', <a href="https://doi.org/{esc(meta["doi"])}" target="_blank" rel="noopener">doi:{esc(meta["doi"])}</a>' if meta.get('doi') else ''
    if not has_body:
        source_html = ''
    elif lic.get('url'):
        source_html = (f'<p class="paper-source" data-pagefind-ignore><i class="ri-information-line" aria-hidden="true"></i> This page reproduces the article {cite_short}{doi_link}, under the '
                       f'<a href="{esc(lic["url"])}" target="_blank" rel="license noopener">{esc(lic.get("name") or "open licence")}</a> licence. '
                       f'Text, tables and figures were extracted from the PDF and the layout adapted for the web; the PDF is the version of record.</p>')
    else:
        source_html = (f'<p class="paper-source" data-pagefind-ignore><i class="ri-information-line" aria-hidden="true"></i> This page reproduces the article {cite_short}{doi_link}, '
                       f'with the permission of the publisher. Text, tables and figures were extracted from the PDF and the layout adapted for the web; '
                       f'the PDF is the version of record.</p>')
    see_also = ''
    if meta.get('see_also'):
        target = pages_index.get(meta['see_also']) or meta['see_also']
        tmeta = next((p for p in pubs if pages_index.get(norm(p['name'])) == target), None)
        see_also = (f'<div class="paper-callout"><i class="ri-links-line" aria-hidden="true"></i> This is the conference version of '
                    f'<a href="/{esc(target)}">{esc(tmeta["name"]) if tmeta else "the journal paper"}</a>, which has the full text.</div>')
    elif not has_body:
        see_also = ('<div class="paper-callout"><i class="ri-file-pdf-2-line" aria-hidden="true"></i> The full text of this paper is available as a '
                    f'<a href="{esc(meta.get("pdf_url"))}" target="_blank" rel="noopener">PDF</a>.</div>')

    # related: video, project, papers
    related = []
    vid = next((v for v in videos if norm((v.get('paper') or {}).get('title')) == norm(pub['name'])), None)
    video_btn = video_html = ''
    if vid:
        short = vid.get('format') == 'short'
        thumb = f'https://i.ytimg.com/vi/{vid["id"]}/{"sddefault" if short else "maxresdefault"}.jpg'
        watch = f'https://www.youtube.com/{"shorts/" + vid["id"] if short else "watch?v=" + vid["id"]}'
        video_html = (f'<section id="video" class="paper-video" data-pagefind-ignore><h2>Watch the explainer</h2>'
                      f'<div class="paper-video-card{" is-short" if short else ""}"><div class="yt-player {"yt-9x16" if short else "yt-16x9"}" '
                      f'data-yt-id="{esc(vid["id"])}" data-yt-title="{esc(vid["title"])}"><a class="yt-play" href="{watch}" aria-label="Play video: {esc(vid["title"])}">'
                      f'<img src="{thumb}" data-yt-fallbacks="https://i.ytimg.com/vi/{esc(vid["id"])}/hqdefault.jpg" alt="" loading="lazy" decoding="async">'
                      f'<span class="yt-play-icon" aria-hidden="true"><i class="ri-play-fill"></i></span></a></div>'
                      f'<div class="paper-video-text"><p class="paper-video-title">{esc(vid["title"])}</p>'
                      f'{"<p>" + esc(vid["summary"]) + "</p>" if vid.get("summary") else ""}'
                      f'<p class="paper-video-more"><a href="/videos.html#v-{esc(vid["id"])}">More videos from the lab</a> · <a href="{watch}" target="_blank" rel="noopener">Watch on YouTube</a></p>'
                      f'</div></div></section>')
        video_btn = '<a class="paper-btn" href="#video"><i class="ri-play-circle-line" aria-hidden="true"></i>Video</a>'
    proj = pick_project(meta, pub, projects, sim, pvecs, slug)
    if proj:
        summary = proj.get('summary') or proj.get('subtitle') or proj.get('description') or ''
        img = f'<img src="/{esc(proj["image"])}" alt="" loading="lazy" decoding="async">' if proj.get('image') else ''
        related.append(f'<a class="related-card related-project" href="/projects/{esc(proj["slug"])}/">{img}'
                       f'<span class="related-kind"><i class="ri-flask-line" aria-hidden="true"></i>Research project</span>'
                       f'<strong>{esc(proj.get("title", ""))}</strong><span class="related-text">{esc(clip(re.sub("<[^>]+>", "", summary), 170))}</span></a>')
    mine = {norm(a['name']) for a in meta['authors']} - {PI}
    v = vecs[norm(pub['name'])]
    scored = []
    for p in pubs:
        key = norm(p['name'])
        if key == norm(pub['name']) or (meta.get('see_also') and pages_index.get(key) == meta['see_also']):
            continue
        theirs = {norm(x) for x in re.split(r',\s*(?:(?:and|&)\s+)?|\s+(?:and|&)\s+', p.get('authors', ''))} - {PI}
        s = Similarity.cos(v, vecs[key]) + 0.08 * len(mine & theirs) + (0.03 if p.get('topic') == topic else 0)
        scored.append((s, p.get('year', 0), p))
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
    share = share_image(folder, fig)
    share_url = f'{url}{share}' if share else f'{SITE}/img/logo.png'
    pdf_url = meta.get('pdf_url') or ''
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
           ('citation_pdf_url', pdf_url), ('citation_abstract_html_url', url), ('citation_fulltext_html_url', url if has_body else ''),
           ('citation_keywords', '; '.join(meta.get('keywords') or [])), ('citation_language', meta.get('lang') or 'en')]
    citation_meta = '\n      '.join(f'<meta name="{k}" content="{esc(v)}">' for k, v in cm if v)
    jsonld = {
        '@context': 'https://schema.org', '@type': 'ScholarlyArticle', 'headline': clip(title, 110), 'name': title,
        'author': [dict({'@type': 'Person', 'name': a['name']},
                        **({'affiliation': [{'@type': 'Organization', 'name': affs[str(k)]} for k in a.get('affiliations', []) if str(k) in affs]}
                           if a.get('affiliations') else {})) for a in meta['authors']],
        'datePublished': meta.get('published') or year, 'url': url, 'mainEntityOfPage': url,
        'abstract': meta.get('abstract', ''), 'description': desc, 'image': share_url, 'keywords': ', '.join(meta.get('keywords') or []) or None,
        'identifier': {'@type': 'PropertyValue', 'propertyID': 'DOI', 'value': meta['doi']} if meta.get('doi') else None,
        'sameAs': f'https://doi.org/{meta["doi"]}' if meta.get('doi') else None,
        'isPartOf': {'@type': 'Periodical', 'name': meta.get('journal', '')},
        'about': topic or None, 'inLanguage': meta.get('lang') or 'en', 'isAccessibleForFree': True,
        'license': lic.get('url') or None,
        'encoding': {'@type': 'MediaObject', 'contentUrl': pdf_url, 'encodingFormat': 'application/pdf'} if pdf_url else None,
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
    rtl = meta.get('lang') == 'he'
    if has_body:
        body = f'<div class="paper-text"{" lang=he dir=rtl" if rtl else ""}>\n{body}\n</div>'
    values = {
        'page_title': esc(clip(meta.get('short_title') or title, 90)) + ' | ACML',
        'description': esc(desc), 'url': url, 'share_url': esc(share_url), 'og_title': esc(meta.get('short_title') or title),
        'authors_plain': esc(', '.join(a['name'] for a in meta['authors'])),
        'citation_meta': citation_meta,
        'jsonld': json.dumps(jsonld, ensure_ascii=False, indent=2).replace('</', '<\\/'),
        'math_head': math_head, 'videos_css': '<link href="/css/videos.css" rel="stylesheet">' if vid else '',
        'videos_js': '<script src="/js/videos.js"></script>' if vid else '',
        'topic': esc(topic or 'Publications'),
        'kicker': ' · '.join(x for x in [f'<em>{esc(meta.get("journal", ""))}</em>' if meta.get('journal') else '',
                                         human_date(meta.get('published')) or esc(year)] if x),
        'oa_badge': '<span class="oa-badge"><i class="ri-lock-unlock-line" aria-hidden="true"></i>Open access</span>' if lic.get('url') else '',
        'title': esc(title), 'title_class': ' is-long' if len(title) > 120 else '', 'authors_html': authors_html, 'affiliations': affs_block,
        'pdf': esc(pdf_url), 'doi_button': (f'<a class="paper-btn" href="https://doi.org/{esc(meta["doi"])}" target="_blank" rel="noopener">'
                                            '<i class="ri-external-link-line" aria-hidden="true"></i>Journal page</a>') if meta.get('doi') else '',
        'read_label': 'Read the paper' if has_body else 'Read the abstract', 'video_button': video_btn,
        'lab_authors': (f'<div class="lab-authors"><span class="lab-authors-label">ACML authors</span>{"".join(lab_chips)}</div>') if lab_chips else '',
        'glance': glance, 'toc': toc_html(tokens, extra_toc, ['<li><a href="#video">Video</a></li>'] if vid else []), 'info': info_html,
        'year': esc(year),
        'abstract': esc(meta.get('abstract', '')), 'body': body, 'notes': notes_html, 'source': source_html, 'see_also': see_also,
        'video_section': video_html, 'related': related_html,
        'apa': esc(apa), 'bibtex': esc(bib),
    }
    values['body'] = re.sub(r'<(ol|ul) class="paper-refs"', r'<\1 class="paper-refs" data-pagefind-ignore', values['body'])
    page = string.Template(template.read_text(encoding='utf-8')).substitute(values)
    out = folder / 'index.html'
    changed = not out.exists() or out.read_text(encoding='utf-8') != page
    if changed:
        out.write_text(page, encoding='utf-8')
    figs = [m for m in re.findall(r'<figure id="(fig-[\w-]+)">', body) if (folder / 'figures' / f'{m}.webp').exists()]
    return {'title': pub['name'], 'slug': slug, 'url': f'publications/{slug}/', 'doi': meta.get('doi', ''),
            'summary': desc, 'changed': changed, 'full_text': has_body, 'year': year, 'journal': meta.get('journal', ''),
            'authors': [a['name'] for a in meta['authors']], 'plain_summary': meta.get('summary') or '',
            'abstract': meta.get('abstract', ''), 'figures': figs, 'video': bool(vid)}


# ---------------------------------------------------------------- site files
def replace_block(text, start_line, end_line, new_lines):
    if start_line in text:
        a = text.index(start_line)
        a = text.rfind('\n', 0, a) + 1
        b = text.index(end_line, a)
        b = text.find('\n', b) + 1
        return text[:a] + new_lines + text[b:]
    return None


IMAGE_NS = 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'


def update_sitemap(pages, today):
    """The paper pages (with their figures, for image search) between the markers in sitemap.xml."""
    path = ROOT / 'sitemap.xml'
    raw = path.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw.decode('utf-8-sig')
    eol = '\r\n' if '\r\n' in text else '\n'
    if IMAGE_NS not in text:
        text = text.replace('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' + eol + '  ' + IMAGE_NS, 1)
    old = dict(re.findall(r'<loc>(.*?)</loc>\s*<lastmod>(.*?)</lastmod>', text))
    lines = [f'  <!-- {MARK_START} -->']
    for p in pages:
        loc = f'{SITE}/{p["url"]}'
        lastmod = old.get(loc) if not p['changed'] and old.get(loc) else f'{today}T00:00:00.000Z'
        lines += ['  <url>', f'    <loc>{loc}</loc>', f'    <lastmod>{lastmod}</lastmod>', f'    <priority>{"0.80" if p["full_text"] else "0.60"}</priority>']
        for fig in p['figures'][:50]:
            lines.append(f'    <image:image><image:loc>{loc}figures/{fig}.webp</image:loc></image:image>')
        lines.append('  </url>')
    lines.append(f'  <!-- {MARK_END} -->')
    block = eol.join(lines) + eol
    new = replace_block(text, MARK_START, MARK_END, block)
    if new is None:
        i = text.index('</urlset>')
        new = text[:i] + block + text[i:]
    path.write_bytes((b'\xef\xbb\xbf' if bom else b'') + new.encode('utf-8'))


def update_llms(pages):
    """The paper pages, newest first, between the markers in llms.txt: title, authors, journal, DOI, a short
    summary, and a link to the full text as Markdown (paper.md, easiest for language models to read)."""
    path = ROOT / 'llms.txt'
    if not path.exists():
        return
    raw = path.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw.decode('utf-8-sig')
    eol = '\r\n' if '\r\n' in text else '\n'
    full = sum(1 for p in pages if p['full_text'])
    lines = [f'<!-- {MARK_START} -->', '## Papers', '',
             f'Every ACML paper has its own page ({len(pages)} pages, {full} with the full text). A page has the abstract, a plain-language '
             'summary with key findings, the full text with figures, tables, equations and references, citation formats (APA, BibTeX), '
             'a link to the PDF, and related papers and projects. The full text of each paper is also published as Markdown next to its page '
             '(`paper.md`). The Publications page has a full-text search over all the papers: '
             f'{SITE}/publications.html?q=your+words', '']
    by_year = collections.defaultdict(list)
    for p in pages:
        by_year[str(p.get('year') or 'Other')].append(p)
    for year in sorted(by_year, reverse=True):
        lines += [f'### {year}', '']
        for p in sorted(by_year[year], key=lambda x: x['title'].lower()):
            names = p['authors']
            who = ', '.join(names[:6]) + (' et al.' if len(names) > 6 else '')
            where = f'*{p["journal"]}*, {year}' if p.get('journal') else str(year)
            doi = f' DOI: {p["doi"]}.' if p.get('doi') else ''
            about = p.get('plain_summary') or p['summary']
            about = re.sub(r'\s+', ' ', about).strip()
            sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', about)
            about = sentences[0] + (' ' + sentences[1] if len(sentences) > 1 and len(sentences[0]) + len(sentences[1]) < 330 else '')
            md = f' Full text (Markdown): {SITE}/{p["url"]}paper.md' if p['full_text'] else ''
            lines.append(f'- [{p["title"]}]({SITE}/{p["url"]}): {who}. {where}.{doi} {about}{md}')
        lines.append('')
    lines.append(f'<!-- {MARK_END} -->')
    block = eol.join(lines) + eol
    new = replace_block(text, MARK_START, MARK_END, block)
    if new is None:
        new = text.rstrip() + eol + eol + block
    path.write_bytes((b'\xef\xbb\xbf' if bom else b'') + new.encode('utf-8'))


def update_search_index():
    """Full-text search (Pagefind, https://pagefind.app): rebuild the index in pagefind/ when it is installed
    (npm install, once). Without it the pages still build; run npm run build:search later."""
    import shutil
    import subprocess
    npx = shutil.which('npx')
    if not npx or not (ROOT / 'node_modules' / 'pagefind').exists():
        print('Full-text search not updated: run  npm install  once, then  npm run build:search  (or run this script again).')
        return
    r = subprocess.run([npx, '--no-install', 'pagefind', '--site', str(ROOT), '--glob', 'publications/*/index.html', '--force-language', 'en'],
                       cwd=ROOT, capture_output=True, text=True)
    tail = (r.stdout or r.stderr).strip().splitlines()[-3:]
    print('Full-text search index updated (pagefind/).' if r.returncode == 0 else 'Pagefind failed:\n' + '\n'.join(tail))


def main():
    pubs = read_json(ROOT / 'data' / 'academic-publications.json')['publications']
    by_title = {norm(p['name']): p for p in pubs}
    projects = read_json(ROOT / 'data' / 'projects-info.json').get('projects', [])
    docs = [p['name'] + ' ' + p.get('description', '') for p in pubs]
    sim = Similarity(docs)
    ctx = {
        'pubs': pubs, 'lab': lab_index(), 'projects': projects, 'template': TEMPLATE, 'sim': sim,
        'videos': read_json(ROOT / 'data' / 'videos.json').get('videos', []) if (ROOT / 'data' / 'videos.json').exists() else [],
        'vecs': {norm(p['name']): sim.vec(p['name'] + ' ' + p['name'] + ' ' + p.get('description', '')) for p in pubs},
        'pvecs': {p['slug']: sim.vec(' '.join([p.get('title', ''), p.get('title', ''), p.get('summary', ''), p.get('subtitle', ''), p.get('description', ''),
                                               ' '.join(p.get('tags', [])), ' '.join(p.get('methods', []))])) for p in projects},
    }
    by_key = {f'{norm(p["name"])}|{p.get("year")}|{(p.get("type") or "").lower()}': p for p in pubs}
    todo = []
    for folder in sorted(p.parent for p in (ROOT / 'publications').glob('*/paper.json')):
        meta = read_json(folder / 'paper.json')
        pub = by_key.get(f'{norm(meta.get("title"))}|{meta.get("year")}|{(meta.get("pub_type") or "paper").lower()}') or by_title.get(norm(meta.get('title')))
        if not pub:
            print(f'! {folder.name}: title not found in data/academic-publications.json - fix "title" in paper.json')
            continue
        todo.append((folder, pub))
    ctx['pages_index'] = {}
    for folder, pub in sorted(todo, key=lambda t: t[1].get('type') == 'Paper'):
        ctx['pages_index'][norm(pub['name'])] = f'publications/{folder.name}/'
    built = [build_one(folder, pub, ctx) for folder, pub in todo]
    built.sort(key=lambda p: p['slug'])
    index = [{k: p[k] for k in ('title', 'slug', 'url', 'doi')} for p in built]
    (ROOT / 'data' / 'paper-pages.json').write_text(json.dumps({'_readme': 'Made by tools/build_papers.py: papers that have their own page.',
                                                                'pages': index}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    today = dt.date.today().isoformat()
    update_sitemap(built, today)
    update_llms(built)
    changed = sum(1 for p in built if p['changed'])
    print(f'{len(built)} paper pages ({sum(1 for p in built if p["full_text"])} with full text), {changed} rebuilt; '
          f'data/paper-pages.json, sitemap.xml and llms.txt updated.')
    if '--no-search' not in sys.argv:
        update_search_index()


if __name__ == '__main__':
    sys.exit(main())
