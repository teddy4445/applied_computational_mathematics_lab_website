#!/usr/bin/env python3
"""Turn a paper PDF into the editable source of its web page.

    python tools/paper_extract.py <paper.pdf> [--slug my-paper] [--force]

Writes publications/<slug>/:
    paper.md      the full text (sections, tables, figures, references) - edit this to fix anything
    paper.json    title, authors, journal, dates, licence, abstract, summary ... - edit this too
    figures/      the figures as WebP
    <slug>.pdf    a copy of the PDF (Google Scholar wants it next to the page)

Then run  python tools/build_papers.py  to (re)build publications/<slug>/index.html.

The extractor never overwrites a paper whose paper.json says "reviewed": true (use --force).
Layout analysis: PyMuPDF4LLM's layout model (pip install pymupdf4llm). It runs offline and
needs no model downloads. Metadata: the PDF itself, plus Crossref when the network allows it.
"""
import argparse
import datetime as dt
import html
import io
import json
import re
import shutil
import subprocess
import sys
import unicodedata
import urllib.request
from pathlib import Path

import pymupdf
import pymupdf4llm
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBS = ROOT / 'data' / 'academic-publications.json'
TERMINAL = tuple('.?!:;)]"”’')
CAPTION_RE = re.compile(r'^(?:\*\*)?\s*(Fig\.?|Figure|Table)\s*(\d+)\b', re.I)
URL_RE = re.compile(r'https?://\S+')
MONTHS = {m: i for i, m in enumerate(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
                                      'september', 'october', 'november', 'december'], 1)}


# ---------------------------------------------------------------- small helpers
def slugify(text, max_words=8):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    words = re.findall(r'[a-z0-9]+', text)
    return '-'.join(words[:max_words]) or 'paper'


def default_slug(title):
    head = re.split(r'[:?]', title)[0]
    return slugify(head) if len(head.split()) >= 2 else slugify(title)


def iso_date(text):
    m = re.search(r'([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})', text or '')
    if m and m.group(1).lower() in MONTHS:
        return f'{int(m.group(3)):04d}-{MONTHS[m.group(1).lower()]:02d}-{int(m.group(2)):02d}'
    m = re.search(r'(\d{4})-(\d{2})-(\d{2})', text or '')
    return m.group(0) if m else ''


def md_escape(text):
    text = text.replace('\\', '\\\\').replace('*', '\\*').replace('_', '\\_').replace('`', '\\`')
    return re.sub(r'<(?=[A-Za-z/!])', '&lt;', text)


def plain(md):
    """Markdown/HTML inline text -> plain text."""
    t = re.sub(r'<[^>]+>', '', md)
    t = re.sub(r'\\([\\*_`])', r'\1', t.replace('**', '').replace('&lt;', '<'))
    return re.sub(r'(?<![\\\w])\*(?!\s)|(?<!\s)\*(?![\w])', '', t).strip()


def html_inline(md):
    """The inline markdown we generate (**, *, <sup>) -> HTML, for captions and table notes."""
    t = md.replace('&lt;', '<')
    t = t.replace('<sup>', '\x01').replace('</sup>', '\x02')
    t = html.escape(t, quote=False).replace('\x01', '<sup>').replace('\x02', '</sup>')
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![\\*])\*(?!\s)(.+?)(?<![\s\\])\*', r'<em>\1</em>', t)
    return re.sub(r'\\([\\*_`])', r'\1', t)


# ---------------------------------------------------------------- text assembly
def is_bold(span):
    return bool(span['flags'] & 16) or 'bold' in span['font'].lower()


def is_italic(span):
    return bool(span['flags'] & 2) or 'italic' in span['font'].lower()


def line_runs(textline):
    """Spans of one line -> [(text, style)], style in '', 'b', 'i', 'bi', 'sup'. Inserts the spaces
    that PDFs often leave out between spans (e.g. around link annotations)."""
    spans = [s for s in textline['spans'] if s['text']]
    if not spans:
        return []
    base = max(s['size'] for s in spans)
    baseline = max(spans, key=lambda s: s['size'])['origin'][1]
    runs, prev = [], None
    for s in spans:
        t = s['text']
        if prev is not None and runs:
            gap = s['bbox'][0] - prev['bbox'][2]
            if gap > 0.15 * max(s['size'], prev['size']) and not runs[-1][0].endswith(' ') and not t.startswith(' '):
                runs[-1] = (runs[-1][0] + ' ', runs[-1][1])
        if s['size'] < 0.8 * base and s['origin'][1] < baseline - 0.12 * base:
            style = 'sup'
        else:
            style = ('b' if is_bold(s) else '') + ('i' if is_italic(s) else '')
        if runs and runs[-1][1] == style:
            runs[-1] = (runs[-1][0] + t, style)
        else:
            runs.append((t, style))
        prev = s
    return runs


def runs_to_md(runs):
    out = []
    for text, style in runs:
        if not text:
            continue
        lead = text[:len(text) - len(text.lstrip())]
        trail = text[len(text.rstrip()):]
        core = md_escape(text.strip())
        if not core:
            out.append(text)
            continue
        if style == 'sup':
            core = f'<sup>{core}</sup>'
        elif style == 'b':
            core = f'**{core}**'
        elif style == 'i':
            core = f'*{core}*'
        elif style == 'bi':
            core = f'***{core}***'
        out.append(lead + core + trail)
    md = ''.join(out)
    md = re.sub(r'\*\*\s*\*\*', ' ', md)          # **a** **b** -> **a b** (bold split by a space)
    return re.sub(r'[ \t ]+', ' ', md)


class Joiner:
    """Joins the lines of a block. End-of-line hyphens are removed only when the joined word is a
    real word ('accu-rate' -> 'accurate') and the paper never writes it with a hyphen
    ('decision-making' stays)."""

    def __init__(self, words, hyphenated):
        self.words, self.hyphenated = words, hyphenated
        try:
            from spellchecker import SpellChecker      # pip install pyspellchecker (optional)
            self.dictionary = SpellChecker()
        except ImportError:
            self.dictionary = None

    def is_word(self, w):
        return w in self.words or (self.dictionary is not None and w in self.dictionary)

    def join(self, lines):
        text = ''
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if not text:
                text = line
                continue
            m = re.search(r'(\*{0,3})$', text)
            close = m.group(1)
            if close and line.startswith(close) and not line.startswith(close + '*'):
                text, line = text[:-len(close)], line[len(close):]      # **a-** + **b** -> **a-b**
                glue_mark = ''
            else:
                glue_mark = None
            m1 = re.search(r'(\w+)-$', text)
            m2 = re.match(r'([a-z]\w*)', line)
            if m1 and m2:
                whole = (m1.group(1) + m2.group(1)).lower()
                hyph = f'{m1.group(1)}-{m2.group(1)}'.lower()
                if hyph not in self.hyphenated and self.is_word(whole):
                    text = text[:-1] + line
                else:
                    text = text + line
            elif text.endswith('@') or (re.search(r'(https?://|doi\.org/)\S*[/.\-_]$', text) and not line[:1].isupper()):
                text = text + line                     # an e-mail address or URL broken over two lines
            else:
                text = text + ' ' + line
        return re.sub(r'\s+', ' ', text).strip()


def box_lines(box):
    """Markdown text of each line of a layout box. A line that starts with a bold 'Label:' starts a
    new paragraph (CRediT roles, front-matter labels)."""
    groups, cur = [], []
    for tl in box.get('textlines') or []:
        runs = line_runs(tl)
        if not runs:
            continue
        first = runs[0]
        starts_label = first[1] == 'b' and re.match(r'^[A-Z][^:]{1,40}:', first[0].strip() + (runs[1][0] if len(runs) > 1 else ''))
        if starts_label and cur:
            groups.append(cur)
            cur = []
        cur.append(runs_to_md(runs))
    if cur:
        groups.append(cur)
    return groups


def box_size(box):
    sizes = [s['size'] for tl in box.get('textlines') or [] for s in tl['spans'] if s['text'].strip()]
    return max(set(sizes), key=sizes.count) if sizes else 0


def box_max_size(box):
    return max([s['size'] for tl in box.get('textlines') or [] for s in tl['spans'] if s['text'].strip()] or [0])


def box_all_bold(box):
    spans = [s for tl in box.get('textlines') or [] for s in tl['spans'] if s['text'].strip()]
    return bool(spans) and all(is_bold(s) for s in spans)


# ---------------------------------------------------------------- figures
def save_figure(doc, page_no, rect, out_path, max_width=1800):
    page = doc[page_no]
    rect = pymupdf.Rect(rect)
    img = None
    has_text = bool(page.get_text('words', clip=rect))
    if not has_text:                      # use the embedded raster at its native resolution
        for info in page.get_image_info(xrefs=True):
            r = pymupdf.Rect(info['bbox'])
            if info.get('xref') and r.intersect(rect).get_area() >= 0.9 * rect.get_area():
                data = doc.extract_image(info['xref'])
                img = Image.open(io.BytesIO(data['image']))
                break
    if img is None:                       # vector figure or labels drawn on top: render the area
        pix = page.get_pixmap(clip=rect, dpi=300)
        img = Image.open(io.BytesIO(pix.tobytes('png')))
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')
    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, 'white')
        bg.paste(img, mask=img.split()[3])
        img = bg
    if img.width > max_width:
        img = img.resize((max_width, round(img.height * max_width / img.width)), Image.LANCZOS)
    img.save(out_path, 'WEBP', quality=82, method=6)
    return img


# ---------------------------------------------------------------- metadata
def crossref(doi):
    try:
        req = urllib.request.Request(f'https://api.crossref.org/works/{doi}',
                                     headers={'User-Agent': 'acml-paper-pages (https://acml.teddylazebnik.com)'})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.load(r)['message']
    except Exception as e:  # offline or blocked: the PDF is enough
        print(f'  (Crossref not reachable: {type(e).__name__}; using the PDF only)')
        return None


def parse_authors(md):
    """'Adi Shuchami<sup>1\\*</sup>, Teddy Lazebnik<sup>2,3\\*</sup>, ...' -> list of authors."""
    t = md.replace('**', '').replace('\\*', '*')
    t = re.sub(r'(?<=[A-Za-z.)])(\d+(?:,\d+)*)(?!\d)', r'<sup>\1</sup>', t)   # inline digits -> superscript
    t = re.sub(r'</sup>\s*<sup>', '', t)
    parts = re.split(r',\s*(?![^<]*</sup>)', t)
    authors = []
    for p in parts:
        sups = ''.join(re.findall(r'<sup>(.*?)</sup>', p))
        name = re.sub(r'<sup>.*?</sup>', '', p).replace('*', '').strip(' ,')
        name = re.sub(r'(\D)\d[\d,]*$', r'\1', name).strip()       # affiliation digits not set as superscript
        if not name or len(name) > 60:
            continue
        authors.append({'name': name, 'affiliations': [int(x) for x in re.findall(r'\d+', sups)],
                        'corresponding': '*' in p})
    return authors


def parse_affiliations(md):
    t = md.replace('\\*', '*')
    parts = re.split(r'(?:\*\*)?(?<![\w,])(\d{1,2})(?:\*\*)?\s+(?=[A-Z])', t)
    affs = {}
    for i in range(1, len(parts) - 1, 2):
        affs[int(parts[i])] = plain(parts[i + 1]).strip(' ,')
    return affs


# ---------------------------------------------------------------- main extraction
def extract(pdf_path, slug=None, force=False, pubs_title=None):
    pdf_path = Path(pdf_path)
    doc = pymupdf.open(pdf_path)
    layout = json.loads(pymupdf4llm.to_json(str(pdf_path), use_ocr=False, table_output='html'))
    pages = layout['pages']

    words, hyphenated = set(), set()
    for p in doc:
        t = re.sub(r'(\w)-\n(\w)', r'\1 \2', p.get_text())      # ignore end-of-line hyphenation
        words.update(w.lower() for w in re.findall(r"[A-Za-z]+", t))
        hyphenated.update(w.lower() for w in re.findall(r"[A-Za-z]+(?:-[A-Za-z]+)+", t))
    joiner = Joiner(words, hyphenated)

    body_sizes = [box_size(b) for pg in pages for b in pg['boxes'] if b['boxclass'] == 'text']
    body_size = max(set(body_sizes), key=body_sizes.count) if body_sizes else 10

    # ---- pass 1: classify every layout box ----
    items, sidebar = [], []
    title, article_type, title_size = '', '', 0
    for pg in pages:
        W, H, pno = pg['width'], pg['height'], pg['page_number'] - 1
        wide_text = any(b['x0'] > 0.3 * W and b['boxclass'] in ('text', 'section-header') for b in pg['boxes'])
        for b in pg['boxes']:
            cls = b['boxclass']
            if cls in ('page-header', 'page-footer'):
                continue
            narrow_left = b['x1'] < 0.36 * W and b['x0'] < 0.15 * W
            if pno <= 1 and wide_text and narrow_left and cls != 'picture':
                sidebar.append(b)
                continue
            if cls == 'picture':
                area = (b['x1'] - b['x0']) * (b['y1'] - b['y0'])
                if area >= 0.04 * W * H and b['y0'] > 0.06 * H:
                    items.append({'kind': 'figure', 'page': pno, 'box': b})
                continue
            if cls == 'table':
                items.append({'kind': 'table', 'page': pno, 'box': b})
                continue
            groups = box_lines(b)
            lines = [joiner.join(g) for g in groups]
            text = '\n'.join(lines)
            if not text.strip():
                continue
            ptext = plain(text)
            if pno == 0 and cls == 'section-header' and box_max_size(b) > title_size and len(ptext) > 15:
                if title:
                    article_type = article_type or title.capitalize()
                title, title_size = ptext, box_max_size(b)
                items.append({'kind': 'title', 'page': pno, 'text': ptext})
                continue
            if pno == 0 and cls == 'section-header' and ptext.isupper() and not title:
                article_type = ptext.capitalize()
                continue
            if cls == 'section-header':
                looks_like_text = len(ptext) > 80 or re.match(r'^[^:]{2,40}:\s+\S', ptext)
                if not looks_like_text:
                    items.append({'kind': 'heading', 'page': pno, 'text': ptext, 'size': box_max_size(b)})
                    continue
            if cls == 'caption' or (text.startswith('**') and re.match(r'^(Fig\.?|Figure|Table)\s*\d+\s*[.:|]', ptext, re.I)):
                items.append({'kind': 'caption', 'page': pno, 'text': text, 'plain': ptext})
                continue
            if URL_RE.fullmatch(ptext.strip()):
                continue          # component DOIs printed under tables and figures
            items.append({'kind': 'list' if cls == 'list-item' else 'text', 'page': pno, 'text': text,
                          'plain': ptext, 'size': box_size(b), 'box': b, 'lines': lines})

    # ---- front matter (page 1, before the abstract) ----
    meta = {'title': title, 'article_type': article_type}
    ti = next(i for i, it in enumerate(items) if it['kind'] == 'title')
    ai = next((i for i, it in enumerate(items) if it['kind'] == 'heading' and it['text'].lower().startswith('abstract')), None)
    front = [it for it in items[ti + 1:ai if ai is not None else ti + 4] if it['kind'] == 'text']
    authors_md = front[0]['text'] if front else ''
    meta['authors'] = parse_authors(authors_md)
    meta['affiliations'] = parse_affiliations(front[1]['text']) if len(front) > 1 else {}
    body_items = items[ai + 1:] if ai is not None else items[ti + 1 + len(front):]

    # ---- sidebar: 'Label: value' pairs (PLOS, Frontiers, ... print these down the left margin) ----
    side, key = {}, None
    for b in sidebar:
        for g in box_lines(b):
            t = joiner.join(g)
            m = re.match(r'^\*\*([^*]{2,45}?):?\*\*:?\s*(.*)$', t)
            if m and len(m.group(1)) < 45:
                key = plain(m.group(1)).rstrip(':').strip().lower()
                side[key] = m.group(2).strip()
            elif key:
                side[key] = (side[key] + ' ' + t).strip()
    side = {k: plain(v) for k, v in side.items()}

    # ---- captions: tables are captioned above, figures below (fall back to the other side) ----
    caption_for = {}
    for idx, it in enumerate(body_items):
        if it['kind'] != 'caption':
            continue
        kind = 'table' if it['plain'].lower().startswith('table') else 'figure'
        same = [(j, x) for j, x in enumerate(body_items)
                if x['page'] == it['page'] and x['kind'] == kind and id(x) not in caption_for]
        after = [x for j, x in same if j > idx][:1]
        before = [x for j, x in same if j < idx][-1:]
        for x in (after + before if kind == 'table' else before + after)[:1]:
            caption_for[id(x)] = re.sub(r'\s*https?://\S+$', '', it['text']).strip()

    # ---- pass 2: body flow ----
    abstract, blocks, refs = [], [], []
    pending, open_par = [], False
    last_float = None            # the latest table/figure, until body text follows it
    seen_text_on = set()
    section = 'abstract' if ai is not None else 'body'
    fig_n = tab_n = 0

    def flush():
        nonlocal pending
        blocks.extend(pending)
        pending = []

    heading_sizes = sorted({round(it['size'], 1) for it in body_items if it['kind'] == 'heading'
                            and not it['text'].lower().startswith(('abstract', 'references'))}, reverse=True)

    for it in body_items:
        k = it['kind']
        if k == 'caption':
            continue
        if k == 'heading':
            flush()
            open_par, last_float = False, None
            name = it['text'].strip()
            if re.match(r'^(references|bibliography|literature cited)$', name, re.I):
                section = 'refs'
                continue
            section = 'body'
            size = round(it['size'], 1)
            level = 2 + min(heading_sizes.index(size) if size in heading_sizes else 0, 2)
            blocks.append({'type': 'heading', 'level': level, 'text': name})
            continue
        if section == 'refs' and k in ('list', 'text'):
            refs.append(it)
            continue
        if k in ('figure', 'table'):
            fl = {'type': k, 'page': it['page'], 'box': it['box'], 'caption': caption_for.get(id(it), ''), 'notes': []}
            if section == 'abstract':
                section = 'body'
            (pending if open_par else blocks).append(fl)
            last_float = fl
            continue
        # text or list item
        if (last_float is not None and last_float['type'] == 'table' and it['page'] == last_float['page']
                and it['size'] and it['size'] < body_size - 0.5):
            note = re.sub(r'\s*https?://\S+$', '', it['text']).strip()        # table footnote
            if note:
                last_float['notes'].append(note)
            continue
        text = it['text']
        if section == 'abstract':
            if abstract and not plain(abstract[-1]).rstrip().endswith(TERMINAL):
                abstract[-1] = abstract[-1] + ' ' + text
            else:
                abstract.append(text)
            continue
        first_on_page = it['page'] not in seen_text_on
        seen_text_on.add(it['page'])
        prev = blocks[-1] if blocks and blocks[-1].get('type') == 'p' else None
        cont = open_par and prev is not None and (
            text[:1].islower() or text[:1].isdigit() or prev['text'].endswith('-')
            or (first_on_page and prev.get('page') == it['page'] - 1))     # a sentence running over the page break
        if cont:
            sep = '' if prev['text'].endswith('-') and text[:1].islower() else ' '
            prev['text'] = prev['text'] + sep + text
        else:
            for line in (it.get('lines') or [text]):
                blocks.append({'type': 'p', 'text': line, 'page': it['page']})
        last_float = None
        blocks[-1]['page'] = it['page']
        open_par = not plain(blocks[-1]['text']).rstrip().endswith(TERMINAL)
        if not open_par:
            flush()
    flush()

    # ---- references: split on the running numbers, keep their links ----
    ref_text = ' '.join(r['text'] for r in refs)
    ref_text = plain(ref_text)
    uris = [l['uri'] for pg in doc for l in pg.get_links() if l.get('uri')]
    references = []
    n, pos = 1, 0
    starts = []
    while True:
        m = re.compile(rf'(?:^|\s){n}\.\s').search(ref_text, pos)
        if not m:
            break
        starts.append((n, m.start()))
        pos, n = m.end(), n + 1
    for i, (num, st) in enumerate(starts):
        end = starts[i + 1][1] if i + 1 < len(starts) else len(ref_text)
        t = ref_text[st:end].strip()
        t = re.sub(rf'^{num}\.\s*', '', t)
        for u in uris:            # mend URLs that were split over two lines
            if u not in t:
                for cut in range(8, len(u)):
                    broken = u[:cut] + ' ' + u[cut:]
                    if broken in t:
                        t = t.replace(broken, u)
                        break
        doi = re.search(r'https?://(?:dx\.)?doi\.org/(10\.\S+?)(?=\s*PMID|\s|$)', t)
        pmid = re.search(r'PMID:\s*(\d+)', t)
        clean = re.sub(r'https?://(?:dx\.)?doi\.org/10\.\S+?(?=\s*PMID|\s|$)', '', t)
        clean = re.sub(r'PMID:\s*\d+', '', clean)
        clean = re.sub(r'\s+', ' ', clean).strip()
        references.append({'n': num, 'text': clean, 'doi': doi.group(1).rstrip('.') if doi else '',
                           'pmid': pmid.group(1) if pmid else ''})

    # ---- metadata ----
    first_text = doc[0].get_text() + ' ' + (doc.metadata.get('subject') or '')
    doi_m = re.search(r'10\.\d{4,9}/[^\s"<>]+', first_text)
    doi = doi_m.group(0).rstrip('.,;)') if doi_m else ''
    doi = re.sub(r'(PLOS|PLoS).*$', '', doi)
    meta['doi'] = doi
    cite = side.get('citation', '')
    vm = re.search(r'(\d+)\((\d+)\):\s*([eE]?\d+(?:[–-]\d+)?)', cite)
    jm = re.search(r'([A-Z][A-Za-z&.\- ]{2,60}?)\s+\d+\(\d+\):', cite)
    meta.update({
        'journal': (doc.metadata.get('subject') or '').split(doi)[-1].split(',')[0].strip() if doi and doi in (doc.metadata.get('subject') or '') else (jm.group(1).strip() if jm else ''),
        'volume': vm.group(1) if vm else '', 'issue': vm.group(2) if vm else '', 'pages': vm.group(3) if vm else '',
        'published': iso_date(side.get('published', '')), 'received': iso_date(side.get('received', '')),
        'accepted': iso_date(side.get('accepted', '')),
        'editor': side.get('editor', ''), 'funding': side.get('funding', ''),
        'competing_interests': side.get('competing interests', ''),
        'data_availability': next((v for k, v in side.items() if k.startswith('data availability')), ''),
        'copyright': side.get('copyright', ''),
    })
    lic = next((u for u in uris if 'creativecommons.org' in u), '')
    if not lic and 'creative commons attribution' in meta['copyright'].lower():
        lic = 'https://creativecommons.org/licenses/by/4.0/'
    meta['license'] = {'url': lic, 'name': 'CC BY 4.0' if '/by/' in lic else ('Creative Commons' if lic else '')}
    abbr = next((v for k, v in side.items() if k.startswith('abbrev')), '')
    meta['abbreviations'] = [[a.strip(), b.strip(' .')] for a, b in
                             (x.split(',', 1) for x in abbr.split(';') if ',' in x)]
    meta['abstract'] = plain(' '.join(abstract))

    names = re.split(r',\s*', re.split(r'\(\d{4}\)', cite)[0].strip()) if cite else []
    if len(names) == len(meta['authors']):
        for a, n in zip(meta['authors'], names):
            m = re.match(r'^(.+?)\s+([A-Z]{1,4})$', n.strip())
            if m and a['name'].endswith(m.group(1)):
                a['family'] = m.group(1)
                a['given'] = a['name'][:-len(m.group(1))].strip()
    for a in meta['authors']:
        if 'family' not in a:
            parts = a['name'].rsplit(' ', 1)
            a['given'], a['family'] = (parts[0], parts[1]) if len(parts) == 2 else ('', a['name'])

    cr = crossref(doi) if doi else None
    if cr:
        meta['journal'] = (cr.get('container-title') or [meta['journal']])[0]
        meta['volume'] = cr.get('volume', meta['volume'])
        meta['issue'] = cr.get('issue', meta['issue'])
        meta['pages'] = cr.get('page') or cr.get('article-number') or meta['pages']
        parts = (cr.get('published') or {}).get('date-parts', [[]])[0]
        if len(parts) == 3 and not meta['published']:
            meta['published'] = '%04d-%02d-%02d' % tuple(parts)
        for a, c in zip(meta['authors'], cr.get('author', [])):
            if c.get('family'):
                a['family'], a['given'] = c['family'], c.get('given', a.get('given', ''))
            if c.get('ORCID'):
                a['orcid'] = c['ORCID']

    if pubs_title:
        meta['title'] = pubs_title

    # ---- write the page source ----
    slug = slug or default_slug(meta['title'])
    out = ROOT / 'publications' / slug
    if (out / 'paper.json').exists() and not force:
        old = json.loads((out / 'paper.json').read_text(encoding='utf-8'))
        if old.get('reviewed'):
            sys.exit(f'{out}/paper.json is marked reviewed; not overwriting it (use --force).')
    (out / 'figures').mkdir(parents=True, exist_ok=True)

    md = []
    shares = []
    for bl in blocks:
        t = bl.get('type')
        if t == 'heading':
            md.append('#' * bl['level'] + ' ' + bl['text'])
        elif t == 'p':
            line = bl['text']
            line = re.sub(r'^(\d+)\.(\s)', r'\1\\.\2', line)      # not a numbered list
            line = re.sub(r'^([#>+\-])', r'\\\1', line)
            md.append(line)
        elif t == 'figure':
            m = CAPTION_RE.match(plain(bl['caption'])) if bl['caption'] else None
            fig_n = int(m.group(2)) if m else fig_n + 1
            name = f'fig-{fig_n}'
            img = save_figure(doc, bl['page'], [bl['box'][k] for k in ('x0', 'y0', 'x1', 'y1')], out / 'figures' / f'{name}.webp')
            shares.append((name, img))
            cap = re.sub(r'\s*https?://doi\.org/\S+$', '', bl['caption']).strip()
            cap_plain = plain(cap)
            label = CAPTION_RE.match(cap_plain)
            title_text = cap_plain[label.end():].lstrip('. ') if label else cap_plain
            alt = re.split(r'(?<=\.)\s', title_text)[0].rstrip('.')
            md.append(f'<figure id="{name}">\n<img src="figures/{name}.webp" width="{img.width}" height="{img.height}" '
                      f'alt="{html.escape(alt)}" loading="lazy" decoding="async">\n'
                      f'<figcaption>{html_inline(cap)}</figcaption>\n</figure>')
        elif t == 'table':
            cap = bl['caption']
            m = CAPTION_RE.match(plain(cap)) if cap else None
            tab_n = int(m.group(2)) if m else tab_n + 1
            table_html = (bl['box'].get('table') or {}).get('html') or ''
            table_html = re.sub(r'<tr>((?:<td>[^<]*</td>)(?:<td></td>)+)</tr>', r'<tr class="row-group">\1</tr>', table_html)
            notes = ''.join(f'<p class="table-note">{html_inline(n)}</p>' for n in bl['notes'])
            md.append(f'<figure class="table-figure" id="table-{tab_n}">\n<figcaption>{html_inline(cap)}</figcaption>\n'
                      f'<div class="table-scroll">{table_html}</div>\n{notes}\n</figure>')
    md_text = '\n\n'.join(md).strip() + '\n'

    if references:
        md_text += '\n## References\n\n'
        for r in references:
            extra = []
            if r['doi']:
                extra.append(f'[doi:{r["doi"]}](https://doi.org/{r["doi"].replace("(", "%28").replace(")", "%29")})')
            if r['pmid']:
                extra.append(f'[PubMed {r["pmid"]}](https://pubmed.ncbi.nlm.nih.gov/{r["pmid"]}/)')
            md_text += f'{r["n"]}. {md_escape(r["text"])}' + (' ' + ' · '.join(extra) if extra else '') + '\n'

    (out / 'paper.md').write_text(md_text, encoding='utf-8')

    # the PDF next to the page (Scholar requirement); shrink big ones when Ghostscript is installed
    pdf_out = out / f'{slug}.pdf'
    shutil.copyfile(pdf_path, pdf_out)
    if pdf_out.stat().st_size > 5_000_000 and shutil.which('gs'):
        tmp = pdf_out.with_suffix('.small.pdf')
        subprocess.run(['gs', '-q', '-sDEVICE=pdfwrite', '-dPDFSETTINGS=/ebook', '-dNOPAUSE', '-dBATCH',
                        f'-sOutputFile={tmp}', str(pdf_out)], check=False)
        if tmp.exists() and tmp.stat().st_size < pdf_out.stat().st_size:
            tmp.replace(pdf_out)

    meta.update({
        'slug': slug, 'short_title': '', 'pdf': pdf_out.name, 'featured_figure': shares[0][0] if shares else '',
        'summary': '', 'key_findings': [], 'key_numbers': [], 'related_project': '',
        'reviewed': False,
        'extracted': {'with': f'pymupdf4llm {pymupdf4llm.__version__} (layout)', 'on': dt.date.today().isoformat(),
                      'from': pdf_path.name, 'figures': len(shares),
                      'tables': sum(1 for b in blocks if b.get('type') == 'table'),
                      'references': len(references)},
    })
    if (out / 'paper.json').exists() and not force:
        old = json.loads((out / 'paper.json').read_text(encoding='utf-8'))
        for k in ('short_title', 'summary', 'key_findings', 'key_numbers', 'related_project', 'featured_figure'):
            if old.get(k):
                meta[k] = old[k]
    (out / 'paper.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{out.relative_to(ROOT)}: {len(blocks)} blocks, {len(shares)} figures, '
          f'{meta["extracted"]["tables"]} tables, {len(references)} references')
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pdf')
    ap.add_argument('--slug', help='folder name / web address; default: from the title')
    ap.add_argument('--title', help='use this title (default: the title in data/academic-publications.json or the PDF)')
    ap.add_argument('--force', action='store_true', help='overwrite a reviewed paper')
    a = ap.parse_args()
    title = a.title
    if not title and PUBS.exists():      # prefer the title as listed on the Publications page
        pubs = json.loads(PUBS.read_text(encoding='utf-8-sig'))['publications']
        name = Path(a.pdf).name
        hit = next((p for p in pubs for l in p.get('fileLinks', []) if l.get('type') == 1 and l.get('link', '').endswith('/' + name)), None)
        title = hit['name'] if hit else None
    extract(a.pdf, a.slug, a.force, title)


if __name__ == '__main__':
    main()
