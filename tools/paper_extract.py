#!/usr/bin/env python3
"""Turn paper PDFs into the editable source of their web pages.

    python tools/paper_extract.py all                  every paper in data/academic-publications.json
    python tools/paper_extract.py <file.pdf> [--slug my-paper]
    options: --pdf-dir DIR (default: ../teddy_lazebnik_academic_website/files)  --force  --only-new

For each paper it writes publications/<slug>/:
    paper.md      the full text: sections, paragraphs, lists, equations, figures, tables, references
    paper.json    title, authors, journal, dates, DOI, abstract, keywords, summary ... (edit freely)
    figures/      figures, equations and image-tables as WebP
The PDF itself is not copied: the page links to it at https://teddylazebnik.com/files/<name>.
Then run  python tools/build_papers.py  to (re)build the HTML pages.

A paper whose paper.json says "reviewed": true is skipped unless --force. Summary fields
(summary, key_findings, key_numbers, featured_figure, related_project, short_title) are always kept.

How it works: PyMuPDF4LLM's layout model (offline, no downloads) finds the page regions (text,
headings, lists, figures, tables, formulas, captions, headers/footers); the text itself is read
with PyMuPDF so word spacing is exact. Title, authors, year, journal and abstract come from
data/academic-publications.json. Each paper gets a completeness score: the share of the PDF's
body words that made it into paper.md (extracted.coverage in paper.json).
"""
import argparse
import collections
import datetime as dt
import html
import io
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

import pymupdf
import pymupdf4llm
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBS = ROOT / 'data' / 'academic-publications.json'
PDF_URL_BASE = 'https://teddylazebnik.com'
DEFAULT_PDF_DIR = ROOT.parent / 'teddy_lazebnik_academic_website' / 'files'
KEEP_FIELDS = ('short_title', 'summary', 'key_findings', 'key_numbers', 'featured_figure', 'related_project', 'see_also', 'reviewed')

TERMINAL = tuple('.?!:;)]"”’')
LABEL_RE = re.compile(r'^\s*(?:\*\*)?\s*(fig\.?|figure|table|tab\.|algorithm|listing)\s*((?-i:[A-Z])[.\-]?\d+[a-z]?|\d+[a-z]?|(?-i:[IVXL]+)[a-z]?)(?:\*\*)?\s*([.:|—–-]|\s|$)', re.I)
INTRO_RE = re.compile(r'^(?:\d+\.?|[IVX]+\.?|[A-Z]\.)?\s*(introduction|background|motivation|overview|preface|מבוא|הקדמה)\b', re.I)
REFS_RE = re.compile(r'^(?:\d+\.?\s*)?(references?|bibliography|literature cited|works cited|reference list|cited literature|מקורות|ביבליוגרפיה|רשימת מקורות)\s*:?$', re.I)
AFTER_REFS_RE = re.compile(r'^(?:[A-Z]\.?\s+|\d+\.?\s+)?(appendix|appendices|supplementary|supporting information|supplemental|nomenclature)', re.I)
FRONT_START_RE = re.compile(r'^(?:\*\*)?\s*(abstract|summary\b|keywords?|key words|index terms|msc\b|jel\b|highlights|graphical abstract|article info|a r t i c l e|'
                            r'article history|received|accepted|published|available online|correspondence|\*?\s*corresponding|e-?mail|citation|'
                            r'copyright|©|https?://doi|doi\b|academic editor|edited by|reviewed by|open access|to cite this|cite this article|'
                            r'this is an open[ -]access|this article is (?:an open|licensed|distributed)|supplementa(?:l|ry) (?:material|information|data) (?:is )?available|'
                            r'תקציר|מילות מפתח)', re.I)
STRUCT_RE = re.compile(r'^(?:\*\*)?\s*(purpose|background|objectives?|aims?|design|setting|participants|patients|methods?|materials and methods|'
                       r'main outcome measures?|measurements|results|findings|conclusions?|interpretation|importance|context|significance|'
                       r'financial disclosures?(?:\(s\))?)\s*(?:\*\*)?\s*:', re.I)
AFFIL_RE = re.compile(r'(universit|institut|department|faculty|school of|college|hospital|centre|center|laborator|ministry|clinic|academy|'
                      r'inc\.|ltd|gmbh|foundation|research|אוניברסיט|המחלקה)', re.I)
MONTHS = {m: i for i, m in enumerate(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
                                      'september', 'october', 'november', 'december'], 1)}
MONTHS.update({m[:3]: i for m, i in list(MONTHS.items())})
MONTHS['sept'] = 9
STOP = set('a an the of in on for and to with by using via from as at into its their is are be or'.split())
FLAGS = (pymupdf.TEXTFLAGS_DICT & ~pymupdf.TEXT_PRESERVE_LIGATURES & ~pymupdf.TEXT_PRESERVE_IMAGES) | pymupdf.TEXT_MEDIABOX_CLIP


# ================================================================ small helpers
def slugify(text, max_words=7):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    words = [w for w in re.findall(r'[a-z0-9]+', text) if w not in STOP]
    return '-'.join(words[:max_words]) or 'paper'


def norm(text):
    text = unicodedata.normalize('NFKD', str(text or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '', text)


def tokens(text):
    return re.findall(r'[^\W\d_]{3,}', (text or '').lower())


def md_escape(text):
    text = text.replace('\\', '\\\\').replace('*', '\\*').replace('_', '\\_').replace('`', '\\`')
    return re.sub(r'<(?=[A-Za-z/!])', '&lt;', text)


TAG_RE = re.compile(r'</?(?:sup|sub|strong|em|b|i|u|br|span|p|div|figure|figcaption|img|table|thead|tbody|tr|td|th|a)\b[^>]*>', re.I)


def plain(md):
    t = TAG_RE.sub('', md)
    t = t.replace('&lt;', '<').replace('**', '')
    t = re.sub(r'(?<!\\)\*', '', t)
    return re.sub(r'\\([\\*_`])', r'\1', t).strip()


def html_inline(md):
    """Inline markdown we generate (**, *, <sup>, <sub>) -> HTML (for captions, notes, table cells)."""
    t = md.replace('&lt;', '<')
    for tag in ('sup', 'sub'):
        t = t.replace(f'<{tag}>', f'\x01{tag}\x02').replace(f'</{tag}>', f'\x01/{tag}\x02')
    t = html.escape(t, quote=False)
    t = re.sub(r'\x01(/?)(sup|sub)\x02', r'<\1\2>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![\\*])\*(?!\s)(.+?)(?<![\s\\])\*', r'<em>\1</em>', t)
    return re.sub(r'\\([\\*_`])', r'\1', t)


def parse_date(text):
    text = (text or '').strip()
    m = re.search(r'(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})', text)
    if m and m.group(2).lower() in MONTHS:
        return f'{int(m.group(3)):04d}-{MONTHS[m.group(2).lower()]:02d}-{int(m.group(1)):02d}'
    m = re.search(r'([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})', text)
    if m and m.group(1).lower() in MONTHS:
        return f'{int(m.group(3)):04d}-{MONTHS[m.group(1).lower()]:02d}-{int(m.group(2)):02d}'
    m = re.search(r'(\d{4})-(\d{2})-(\d{2})', text)
    if m:
        return m.group(0)
    m = re.search(r'\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b', text)
    if m and 1 <= int(m.group(2)) <= 12:
        return f'{int(m.group(3)):04d}-{int(m.group(2)):02d}-{int(m.group(1)):02d}'
    return ''


def roman(s):
    vals = {'I': 1, 'V': 5, 'X': 10, 'L': 50}
    total, prev = 0, 0
    for ch in reversed(s.upper()):
        v = vals.get(ch, 0)
        total = total - v if v < prev else total + v
        prev = max(prev, v)
    return total


def label_number(s):
    """'3' -> (3, ''), '2b' -> (2, 'b'), 'IV' -> (4, ''), 'A.1' / 'S2' -> ('a1', '') (appendix and supplement items)."""
    s = s.strip()
    m = re.match(r'^(\d+)([a-z]?)$', s)
    if m:
        return int(m.group(1)), m.group(2)
    m = re.match(r'^([A-Z])[.\-]?(\d+)([a-z]?)$', s)
    if m:
        return f'{m.group(1).lower()}{int(m.group(2))}', m.group(3)
    if re.match(r'^[IVXL]+$', s):
        return roman(s), ''
    return None, ''


def area(r):
    return max(0.0, r[2] - r[0]) * max(0.0, r[3] - r[1])


def inter(a, b):
    return [max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])]


def frac_inside(inner, outer):
    a = area(inner)
    return area(inter(inner, outer)) / a if a else 0.0


def hoverlap(a, b):
    w = min(a[2], b[2]) - max(a[0], b[0])
    return w / max(1.0, min(a[2] - a[0], b[2] - b[0]))


def union(rects):
    return [min(r[0] for r in rects), min(r[1] for r in rects), max(r[2] for r in rects), max(r[3] for r in rects)]


# ================================================================ text: lines, runs, joining
def is_bold(s):
    f = s['font'].lower()
    return bool(s['flags'] & 16) or 'bold' in f or f.endswith(('-b', '.b', '-bd', 'bd', '-semibold', 'medi'))


def is_italic(s):
    f = s['font'].lower()
    return bool(s['flags'] & 2) or 'italic' in f or 'oblique' in f


# Old Elsevier / Taylor & Francis PDFs typeset math with "Advent" fonts whose characters carry no Unicode
# meaning ("x ¼ 2" means "x = 2"). Their glyphs are named either after the slot they stand in for (onequarter
# for "=") or C<n>, n being the TeX math-symbol code (C0 minus, C2 times, C20 less-or-equal ...).
TEX_SY = {0: '−', 1: '·', 2: '×', 3: '∗', 4: '÷', 5: '⋄', 6: '±', 7: '∓', 8: '⊕', 9: '⊖', 10: '⊗', 11: '⊘', 12: '⊙', 13: '○', 14: '°',
          15: '•', 16: '≍', 17: '≡', 18: '⊆', 19: '⊇', 20: '≤', 21: '≥', 22: '⪯', 23: '⪰', 24: '∼', 25: '≈', 26: '⊂', 27: '⊃', 28: '≪',
          29: '≫', 30: '≺', 31: '≻', 32: '←', 33: '→', 34: '↑', 35: '↓', 36: '↔', 39: '≃', 40: '⇐', 41: '⇒', 44: '⇔', 48: '′', 49: '∞',
          50: '∈', 51: '∋', 54: '/', 56: '∀', 57: '∃', 58: '¬', 59: '∅', 62: '⊤', 63: '⊥', 91: '∪', 92: '∩', 94: '∧', 95: '∨',
          102: '{', 103: '}', 104: '⟨', 105: '⟩', 106: '|', 107: '‖', 110: '\\', 112: '√', 114: '∇', 120: '§', 121: '†', 122: '‡', 123: '¶',
          138: ']'}
TEX_EX = {0: '(', 1: ')', 2: '[', 3: ']', 8: '{', 9: '}', 12: '|', 16: '(', 17: ')', 18: '(', 19: ')', 20: '[', 21: ']', 26: '{', 27: '}',
          80: '∑', 81: '∏', 82: '∫', 88: '∑', 89: '∏', 90: '∫', 112: '√', 113: '√'}
ACCENTS = {18: '\u0300', 19: '\u0301', 20: '\u030c', 21: '\u0306', 22: '\u0304', 23: '\u030a', 94: '\u0302', 126: '\u0303', 127: '\u0308'}
ADV_NAMED = {
    'P4C4E74': {'onequarter': '=', 'thorn': '+', 'eth': '(', 'Thorn': ')', 'onehalf': '[', 'eight': '∀', 'two': '∈', 'exclam': '→',
                'f': '{', 'g': '}', 'dollar': '⇔', 'y': '†', 'z': '‡'},
    'P4C4E51': {'colon': '.', 'semicolon': ',', 'equal': '/', 'onequarter': '=', 'thorn': '+', 'eth': '(', 'Thorn': ')'},
    'MacMthSy': {'colon': '.', 'onequarter': '=', 'thorn': '+', 'eth': '(', 'Thorn': ')', 'onehalf': '['},
    'P4C4E59': {'Euro': '\u0308', 'asciicircum': '\u0302'},
    'PS7DED': {'bracketleft': '∈'},
    'PS7CFD': {'asciicircum': '∧'},
}
_ADV = {}
CAL = dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ', '𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵'))
PI_NAMED = {'¼': '=', 'þ': '+', 'ð': '(', 'Þ': ')', '½': '[', '\x8a': ']'}
GREEK_KEYS = dict(zip('abgdezhuiklmnjoprstyfxcvqwABGDEZHUIKLMNJOPRSTYFXCVW',
                      'αβγδεζηθικλμνξοπρστυφχψω;ςΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩΣ'))
SYMBOL_GREEK = dict(zip('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
                        'αβχδεφγηιϕκλμνοπθρστυϖωξψζΑΒΧΔΕΦΓΗΙϑΚΛΜΝΟΠΘΡΣΤΥςΩΞΨΖ'))


def tex_sy(ch):
    n = ord(ch)
    if ch.isspace():
        return ch
    if ch in PI_NAMED:
        return PI_NAMED[ch]
    if ch in CAL:
        return CAL[ch]
    if ch == '6':
        return '\u0338'
    if n in TEX_SY:
        return TEX_SY[n]
    return {63: '⊥', 92: '∩', 98: '⌊', 99: '⌋', 100: '⌈', 101: '⌉', 37: '≍'}.get(n, ch if ch.isspace() else '')


def tex_ex(ch):
    n = ord(ch)
    if ch.isspace():
        return ch
    if ch in 'fi':
        return ''                                       # the bar over a square root
    return {32: '(', 33: ')', 34: '[', 35: ']', 48: '⎛', 49: '⎞', 64: '⎝', 65: '⎠', 66: '⎜', 67: '⎟'}.get(n, TEX_EX.get(n, ch if ch.isspace() else ''))


# fonts of Taylor & Francis / Wiley / Elsevier typesetting that put math symbols on ordinary letters
PI_FONTS = [
    (re.compile(r'TeX_CM_Maths_Symbols|TeX_Times_Math_Symbol'), lambda ch: tex_sy(ch) if not (ch == '=' or ch == '|') else ch),
    (re.compile(r'TeX_CM_Maths_Extension'), tex_ex),
    (re.compile(r'MathematicalPi-One'), lambda ch: {**PI_NAMED, ',': '<', '.': '>', '\x00': '−', '^': '∧', '8': '∀', '2': '∈'}.get(ch, ch)),
    (re.compile(r'MathematicalPi-Four'), lambda ch: {'[': '∈', '<': '∪', '>': '∩', '#': '⊆', '"': '⊂', '=': '≠'}.get(ch, ch)),
    (re.compile(r'MathematicalPi-Six'), lambda ch: {'R': 'ℝ', 'N': 'ℕ', 'Z': 'ℤ', 'Q': 'ℚ', 'C': 'ℂ', '`': '⊤'}.get(ch, ch)),
    (re.compile(r'Greek_Medium|Greek_Bold'), lambda ch: GREEK_KEYS.get(ch, ch)),
    (re.compile(r'PI_chars_1$'), lambda ch: {'S': '∑', '+': '±', 'l': 'λ', 'P': '∏'}.get(ch, ch)),
    (re.compile(r'PI_chars_2$'), lambda ch: {**SYMBOL_GREEK, 'c': 'θ'}.get(ch, ch)),
    (re.compile(r'PI_chars_3$'), lambda ch: {'=': '≠'}.get(ch, ch)),
]
BRACKET_PUA = '‾⏐⎯®©™⎛⎜⎝⎡⎢⎣⎧⎨⎩⎪⎮⎞⎟⎠⎤⎥⎦⎫⎬⎭'
SYMBOL_PUA = {0x20: ' ', 0xa0: ' ', 0x4a: 'ϑ', 0x6a: 'ϕ', 0x76: 'ϖ', 0x22: '∀', 0x24: '∃', 0x27: '∋', 0x2d: '−', 0x40: '≅', 0x5c: '∴', 0x5e: '⊥', 0x60: '‾', 0x7e: '∼', 0xa2: '′', 0xa3: '≤', 0xa5: '∞',
              0xa7: '♣', 0xab: '↔', 0xac: '←', 0xad: '↑', 0xae: '→', 0xaf: '↓', 0xb0: '°', 0xb1: '±', 0xb2: '″', 0xb3: '≥', 0xb4: '×',
              0xb5: '∝', 0xb6: '∂', 0xb7: '•', 0xb8: '÷', 0xb9: '≠', 0xba: '≡', 0xbb: '≈', 0xbc: '…', 0xc5: '⊕', 0xc6: '∅', 0xc7: '∩',
              0xc8: '∪', 0xc9: '⊃', 0xca: '⊇', 0xcc: '⊂', 0xcd: '⊆', 0xce: '∈', 0xcf: '∉', 0xd0: '∠', 0xd1: '∇', 0xd6: '√', 0xd7: '⋅',
              0xd8: '¬', 0xd9: '∧', 0xda: '∨', 0xdb: '⇔', 0xdc: '⇐', 0xdd: '⇑', 0xde: '⇒', 0xdf: '⇓', 0xe1: '〈', 0xe5: '∑', 0xf1: '〉', 0xf2: '∫',
              0x61: 'α', 0x62: 'β', 0x63: 'χ', 0x64: 'δ', 0x65: 'ε', 0x66: 'φ', 0x67: 'γ', 0x68: 'η', 0x69: 'ι', 0x6b: 'κ', 0x6c: 'λ', 0x6d: 'μ',
              0x6e: 'ν', 0x6f: 'ο', 0x70: 'π', 0x71: 'θ', 0x72: 'ρ', 0x73: 'σ', 0x74: 'τ', 0x75: 'υ', 0x77: 'ω', 0x78: 'ξ', 0x79: 'ψ', 0x7a: 'ζ',
              0x44: 'Δ', 0x46: 'Φ', 0x47: 'Γ', 0x4c: 'Λ', 0x50: 'Π', 0x51: 'Θ', 0x53: 'Σ', 0x57: 'Ω', 0x58: 'Ξ', 0x59: 'Ψ'}


def raw_math(doc):
    """True when the doc's math fonts give raw character codes (no Unicode mapping): 'x ¼ 2' for 'x = 2'."""
    key = ('raw', id(doc))
    if key not in _ADV:
        raw = False
        for p in doc:
            for b in p.get_text('dict', flags=FLAGS)['blocks']:
                for l in b.get('lines', []):
                    for sp in l['spans']:
                        if any(rx.search(sp['font']) for rx, _ in PI_FONTS) and re.search(r'[\x00-\x08\x0e-\x1f¼þðÞ]', sp['text']):
                            raw = True
                            break
                    if raw:
                        break
                if raw:
                    break
            if raw:
                break
        _ADV[key] = raw
    return _ADV[key]


def adv_fonts(doc):
    """{font name: (glyph names by glyph id, kind)} for the doc's Advent math fonts."""
    if id(doc) in _ADV:
        return _ADV[id(doc)]
    out = {}
    try:
        from fontTools.cffLib import CFFFontSet
    except ImportError:
        CFFFontSet = None
    if CFFFontSet is not None:
        seen = set()
        for p in doc:
            for f in p.get_fonts(full=True):
                name = f[3].split('+', 1)[-1]
                kind = next((k for k in ('P4C4E74', 'P4C4E51', 'P4C4E59', 'P4C4E46', 'MacMthSy', 'PS7DED', 'PS7CFD') if k in name), None)
                if not kind or name in seen or not name.startswith('Adv'):
                    continue
                seen.add(name)
                try:
                    buf = doc.extract_font(f[0])[3]
                    cff = CFFFontSet()
                    cff.decompile(io.BytesIO(buf), None)
                    out[name] = (cff[cff.fontNames[0]].charset, kind)
                except Exception:
                    pass
    _ADV[id(doc)] = out
    return out


def adv_char(kind, glyph):
    """The real character for a glyph of an Advent math font ('' = unknown, None = keep as is)."""
    m = re.fullmatch(r'C(\d+)', glyph or '')
    if m:
        n = int(m.group(1))
        table = TEX_EX if kind == 'P4C4E46' else ACCENTS if kind == 'P4C4E59' else TEX_SY
        return table.get(n, '')
    return ADV_NAMED.get(kind, {}).get(glyph)


def page_spans(page, fonts):
    """The page's text as PyMuPDF 'dict' blocks, rebuilt from the characters: Advent math glyphs get their real
    characters, and word spaces that the PDF only encodes as a gap (no space character) are put back."""
    pos = {}
    if fonts:
        for sp in page.get_texttrace():
            f = fonts.get(sp['font'])
            if f:
                for c in sp['chars']:
                    if 0 <= c[1] < len(f[0]):
                        pos[(round(c[2][0], 1), round(c[2][1], 1))] = adv_char(f[1], f[0][c[1]])
    raw = raw_math(page.parent)
    d = page.get_text('rawdict', flags=FLAGS)
    for b in d['blocks']:
        for l in b.get('lines', []):
            horizontal = abs(l['dir'][1]) < 0.2 and l['dir'][0] > 0
            chars = [(s, c) for s in l['spans'] for c in s['chars']]
            gaps = sorted((c2['bbox'][0] - c1['bbox'][2]) / max(s1['size'], 1) for (s1, c1), (s2, c2) in zip(chars, chars[1:])
                          if c1['c'].isalnum() and c2['c'].isalnum())
            med = gaps[len(gaps) // 2] if gaps else 0
            space_before = set()
            if horizontal:
                for (s1, c1), (s2, c2) in zip(chars, chars[1:]):
                    if not (c1['c'].isalnum() or c1['c'] in '.,;:)]') or not (c2['c'].isalnum() or c2['c'] in '(['):
                        continue
                    size = max(s1['size'], s2['size'], 1)
                    if abs(c1['origin'][1] - c2['origin'][1]) > 0.15 * size or min(s1['size'], s2['size']) < 0.8 * size:
                        continue                        # superscripts, subscripts
                    if (c2['bbox'][0] - c1['bbox'][2]) / size > max(0.12, 2.5 * med + 0.06):
                        space_before.add(id(c2))
            pending = ''
            for s in l['spans']:
                f = fonts.get(s['font'])
                pi = next((fn for rx, fn in PI_FONTS if rx.search(s['font'])), None) if raw else None
                txt = ''
                for c in s['chars']:
                    ch = c['c']
                    if pi is not None:
                        ch = pi(ch)
                    elif f:
                        r = pos.get((round(c['origin'][0], 1), round(c['origin'][1], 1)))
                        if r is not None:
                            if '\u0300' <= r[:1] <= '\u036f':
                                pending = r
                                continue
                            ch = r
                    elif '\udc00' <= ch <= '\udfff':           # half of a math letter (U+1D400...)
                        ch = chr(0x1d400 + ord(ch) - 0xdc00)
                    elif ord(ch) < 32 or ch in '\u200b\ufeff\u2060\ue9d9' or '\ud800' <= ch <= '\udbff':
                        ch = ''
                    elif '\uf8e5' <= ch <= '\uf8fe':          # pieces of big brackets (Adobe Symbol)
                        ch = BRACKET_PUA[ord(ch) - 0xf8e5]
                    elif '\uf020' <= ch <= '\uf0ff':          # Symbol-font characters in the private use area
                        ch = SYMBOL_PUA.get(ord(ch) - 0xf000, chr(ord(ch) - 0xf000) if 0x21 <= ord(ch) - 0xf000 <= 0x7e else '')
                    if pending and ch.strip():
                        ch = ('i' if ch == 'ı' else ch) + pending
                        pending = ''
                    if id(c) in space_before and not txt.endswith(' '):
                        ch = ' ' + ch
                    txt += ch
                txt = txt.replace('\u0338=', '≠').replace('\u0338∈', '∉').replace('\u0338', '/')
                s['text'] = unicodedata.normalize('NFC', txt)
                del s['chars']
    return d


def page_lines(page):
    """All text lines of a page, with spans (PyMuPDF keeps the real word spacing)."""
    out = []
    d = page_spans(page, adv_fonts(page.parent))
    for b in d['blocks']:
        for l in b.get('lines', []):
            spans = [s for s in l['spans'] if s['text']]
            if not spans or not ''.join(s['text'] for s in spans).strip():
                continue
            dx, dy = l['dir']
            out.append({'bbox': list(l['bbox']), 'spans': spans, 'rotated': abs(dy) > 0.2 or dx < 0, 'used': False,
                        'dir': (round(dx), round(dy))})
    return out


def merge_rows(lines):
    """Pieces of one printed line (justified text, hanging numbers, a caption label) -> one line, in reading order."""
    clusters = []
    for l in sorted(lines, key=lambda l: (l['bbox'][1] + l['bbox'][3]) / 2):
        cy = (l['bbox'][1] + l['bbox'][3]) / 2
        h = l['bbox'][3] - l['bbox'][1]
        if clusters and not l['rotated'] and not clusters[-1]['rot'] and abs(cy - clusters[-1]['cy']) < max(2.0, 0.35 * h):
            clusters[-1]['ls'].append(l)
        else:
            clusters.append({'cy': cy, 'ls': [l], 'rot': l['rotated']})
    rows = []
    for c in clusters:
        start = len(rows)
        for l in sorted(c['ls'], key=lambda l: l['bbox'][0]):
            if len(rows) > start and not l['rotated']:
                r = rows[-1]
                if l['bbox'][0] >= r['bbox'][2] - 1:
                    gap = l['bbox'][0] - r['bbox'][2]
                    sp = [] if gap < 0.5 else [dict(r['spans'][-1], text=' ', bbox=(r['bbox'][2], r['bbox'][1], l['bbox'][0], r['bbox'][3]))]
                    r['spans'] = r['spans'] + sp + l['spans']
                    r['bbox'] = [r['bbox'][0], min(r['bbox'][1], l['bbox'][1]), l['bbox'][2], max(r['bbox'][3], l['bbox'][3])]
                    continue
            rows.append(dict(l, spans=list(l['spans']), bbox=list(l['bbox'])))
    return rows


def line_runs(line):
    spans = line['spans']
    real = [s for s in spans if s['text'].strip()]
    if not real:
        return []
    base = max(s['size'] for s in real)
    baseline = max(real, key=lambda s: s['size'])['origin'][1]
    runs, prev = [], None
    for s in spans:
        t = s['text']
        if not t.strip():
            if runs and not runs[-1][0].endswith(' '):
                runs[-1] = (runs[-1][0] + ' ', runs[-1][1])
            prev = None
            continue
        if prev is not None and runs:
            gap = s['bbox'][0] - prev['bbox'][2]
            if gap > 0.22 * max(s['size'], prev['size']) and not runs[-1][0].endswith(' ') and not t.startswith(' '):
                runs[-1] = (runs[-1][0] + ' ', runs[-1][1])
        small = s['size'] < 0.82 * base
        if (s['flags'] & 1 or small) and s['origin'][1] < baseline - 0.12 * base:
            style = 'sup'
        elif small and s['origin'][1] > baseline + 0.12 * base:
            style = 'sub'
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
        lead = text[:len(text) - len(text.lstrip())]
        trail = text[len(text.rstrip()):]
        core = md_escape(text.strip())
        if not core:
            out.append(text)
            continue
        if style in ('sup', 'sub'):
            core = f'<{style}>{core}</{style}>'
        elif style == 'b':
            core = f'**{core}**'
        elif style == 'i':
            core = f'*{core}*'
        elif style == 'bi':
            core = f'***{core}***'
        out.append(lead + core + trail)
    md = ''.join(out)
    md = re.sub(r'\*\*(\s*)\*\*', r'\1', md)
    md = re.sub(r'(?<![*\\])\*(\s+)\*(?!\*)', r'\1', md)
    return re.sub(r'[ \t ]+', ' ', md)


class Joiner:
    """Joins the lines of a block; end-of-line hyphens are removed only when the joined word is a real
    word ('accu-rate' -> 'accurate') and the paper never writes it with a hyphen ('decision-making')."""

    def __init__(self, words, hyphenated):
        self.words, self.hyphenated = words, hyphenated
        try:
            from spellchecker import SpellChecker
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
            m = re.search(r'(?<!\\)(\*{1,3})$', text)
            if m and line.startswith(m.group(1)) and not line.startswith(m.group(1) + '*'):
                text, line = text[:-len(m.group(1))], line[len(m.group(1)):]
                glue = ' '
            else:
                glue = None
            m1 = re.search(r'([^\W\d_]+)[-‐‑]$', text)
            m2 = re.match(r'([a-z][^\W\d_]*)', line)
            if text.endswith('\xad'):                # a soft hyphen: the word continues
                text = text[:-1] + line
            elif m1 and m2:
                whole = (m1.group(1) + m2.group(1)).lower()
                hyph = f'{m1.group(1)}-{m2.group(1)}'.lower()
                text = text[:-1] + '-'
                if hyph not in self.hyphenated and self.is_word(whole):
                    text = text[:-1] + line
                else:
                    text = text[:-1] + '-' + line
            elif (text.endswith(('@', '/')) and not line[:1].isupper()) or re.search(r'(https?://|doi\.org/|www\.)\S*[/.\-_=?&]$', text):
                text = text + line
            else:
                text = text + ' ' + line
        text = re.sub(r'\xad\s*', '', text)
        return re.sub(r'\s+', ' ', text).strip()


def fix_rtl(line):
    """Hebrew lines: punctuation that the PDF's visual order puts at the start belongs at the end."""
    m = re.match(r'^(\s*)([.,:;!?)]+)\s*(.+)$', line)
    if m and re.search(r'[֐-׿]', m.group(3)):
        return m.group(3) + m.group(2)
    return line


# ================================================================ boxes
class Box:
    __slots__ = ('cls', 'page', 'rect', 'lines', 'table', 'idx', 'col', 'kind', 'md', 'size', 'bold', 'text', 'synthetic')

    def __init__(self, cls, page, rect, idx):
        self.cls, self.page, self.rect, self.idx = cls, page, rect, idx
        self.lines, self.table, self.md, self.text, self.kind = [], None, '', '', cls
        self.size, self.bold, self.col, self.synthetic = 0, False, 0, False

    def __repr__(self):
        return f'<{self.cls}/{self.kind} p{self.page} {[round(x) for x in self.rect]} {self.text[:40]!r}>'


def box_style(box):
    spans = [s for l in box.lines for s in l['spans'] if s['text'].strip()]
    if not spans:
        return 0, False
    sizes = collections.Counter()
    for s in spans:
        sizes[round(s['size'], 1)] += len(s['text'])
    size = sizes.most_common(1)[0][0]
    bold = sum(len(s['text']) for s in spans if is_bold(s)) > 0.6 * sum(len(s['text']) for s in spans)
    return size, bold


def lines_to_groups(lines):
    """Markdown per line; a line starting with a bold 'Label:' (or a bullet) starts a new group."""
    groups, cur = [], []
    for l in lines:
        runs = line_runs(l)
        if not runs:
            continue
        first = runs[0][0].strip()
        nxt = first + (runs[1][0] if len(runs) > 1 else '')
        starts = (runs[0][1].startswith('b') and re.match(r'^[A-Z][^:]{1,45}:', nxt) is not None) or re.match(r'^[•●▪◦■]\s*', first)
        if starts and cur:
            groups.append(cur)
            cur = []
        cur.append(runs_to_md(runs))
    if cur:
        groups.append(cur)
    return groups


# ================================================================ figures
def touches(a, b, pad=3.0):
    return a[0] - pad <= b[2] and b[0] - pad <= a[2] and a[1] - pad <= b[3] and b[1] - pad <= a[3]


def grow_picture(rect, items, stops, W, H):
    """Pictures found by the layout model can miss parts of vector art: add the drawings that touch them."""
    r = list(rect)
    for _ in range(4):
        changed = False
        for it in items:
            if touches(r, it) and not (it[0] >= r[0] and it[1] >= r[1] and it[2] <= r[2] and it[3] <= r[3]):
                cand = union([r, it])
                if cand[2] - cand[0] > 0.97 * W or cand[3] - cand[1] > 0.92 * H:
                    continue
                if any(touches(cand, st, pad=-1) for st in stops):
                    continue
                r, changed = cand, True
        if not changed:
            break
    return r


def grow_formula(rect, items, W):
    """Formula boxes can be narrower than the printed equation: take the rest of its line(s) and the number."""
    x0, y0, x1, y1 = rect
    if x1 < 0.56 * W:
        lo, hi = 0, 0.54 * W
    elif x0 > 0.44 * W:
        lo, hi = 0.46 * W, W
    else:
        lo, hi = 0, W
    r = list(rect)
    for it in items:
        h = max(it[3] - it[1], 0.5)
        ov = min(it[3], y1) - max(it[1], y0)
        if (ov >= 0.6 * h or (h < 1.5 and y0 - 1 <= it[1] <= y1 + 1)) and it[0] >= lo - 1 and it[2] <= hi + 1:
            r = union([r, it])
    return r


def render_region(doc, pno, rect, out_path, max_width=1800, min_dpi=110, max_dpi=300, rotate=0):
    page = doc[pno]
    r = pymupdf.Rect(rect) & page.rect
    dpi = 200
    for info in page.get_image_info():
        ib = pymupdf.Rect(info['bbox'])
        if ib.intersects(r) and ib.width > 5 and info.get('width'):
            native = info['width'] / (ib.width / 72)
            dpi = max(dpi, min(native, max_dpi))
    dpi = max(min_dpi, min(dpi, max_width / max(r.width / 72, 0.1)))
    pix = page.get_pixmap(clip=r, dpi=int(round(dpi)), alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
    if rotate:
        img = img.rotate(rotate, expand=True)
        r = pymupdf.Rect(0, 0, r.height, r.width)
    if img.width > max_width:
        img = img.resize((max_width, round(img.height * max_width / img.width)), Image.LANCZOS)
    img.save(out_path, 'WEBP', quality=82, method=6)
    return img.size + (r.width, r.height)


def display_size(size, scale):
    """(pixel w, pixel h, pt w, pt h) -> the size to show on the page (CSS px), never larger than the image."""
    pw, ph, w, h = size
    dw = min(pw, round(w * scale))
    return dw, round(dw * ph / pw)


# ================================================================ metadata from the front pages
def find_doi(text):
    for m in re.finditer(r'10\.\d{4,9}/[^\s"<>,;]+', text):
        d = m.group(0).rstrip('.)]')
        d = re.sub(r'(PLOS|PLoS|Received|Accepted).*$', '', d)
        if len(d) > 9:
            return d
    return ''


def volume_info(text):
    pats = [
        (r'(\d+)\((\d+)\):\s*(e?\d+(?:[–-]\d+)?)', (1, 2, 3)),                       # PLOS 21(9): e0352682
        (r'\bVol(?:ume)?\.?\s*(\d+)[,\s]+(?:No\.?|Issue)\s*(\d+)[,\s]+(?:pp?\.?\s*)?(\d+(?:[–-]\d+)?)', (1, 2, 3)),
        (r'\b(?:19|20)\d{2},\s*(\d{1,4}),\s*(\d+)\b', (1, None, 2)),                 # MDPI 2023, 11, 426
        (r'\((?:19|20)\d{2}\)\s*(\d{1,4}):(\d+(?:[–-]\d+)?)', (1, None, 2)),         # Springer/BMC (2026) 14:77
        (r'\b(\d{1,4})\s+\((?:19|20)\d{2}\)\s+(\d{3,}|\d+[–-]\d+)\b', (1, None, 2)),   # Elsevier 126 (2023) 106783
    ]
    for p, (a, b, c) in pats:
        m = re.search(p, text)
        if m:
            return m.group(a), (m.group(b) if b else ''), m.group(c)
    return '', '', ''


def parse_front(front_text, side):
    meta = {}
    t = front_text
    for key, pat in (('received', r'Received[:\s]*(?:on\s*)?([^\n;]{6,40})'), ('accepted', r'Accepted(?: for publication)?[:\s]*(?:on\s*)?([^\n;]{6,40})'),
                     ('published', r'(?:Published(?: online)?|Available online|Online publication date)[:\s]*(?:on\s*)?([^\n;]{6,40})')):
        m = re.search(pat, t, re.I)
        if m:
            d = parse_date(m.group(1))
            if d:
                meta[key] = d
    m = re.search(r'(?:Keywords?|Key words|KEYWORDS|Index Terms)\s*[:—–-]?\s*(.{5,400}?)(?:\n\s*\n|\n(?:[A-Z][a-z]+ ?)+:|$|\n\d+\.?\s+[A-Z]|\nMSC|\nJEL|\nAbstract|\n1\s)', t, re.S)
    if m:
        kw = re.sub(r'\s+', ' ', m.group(1)).strip()
        parts = [p.strip(' .') for p in re.split(r'\s*[;·,•]\s*|\s{2,}', kw) if 1 < len(p.strip(' .')) < 60]
        if 1 < len(parts) <= 15:
            meta['keywords'] = parts
    for k, v in side.items():
        lk = k.lower()
        if 'fund' in lk:
            meta['funding'] = v
        elif 'competing' in lk or 'conflict' in lk:
            meta['competing_interests'] = v
        elif 'data availab' in lk:
            meta['data_availability'] = v
        elif lk.startswith('abbrev'):
            meta['abbreviations'] = [[a.strip(), b.strip(' .')] for a, b in (x.split(',', 1) for x in v.split(';') if ',' in x)]
        elif lk.startswith(('editor', 'edited by', 'academic editor')):
            meta['editor'] = v
    return meta


# ================================================================ the extractor
class Extractor:
    def __init__(self, pdf_path, pub):
        self.pdf_path, self.pub = Path(pdf_path), pub
        self.doc = pymupdf.open(self.pdf_path)
        cache = Path(os.environ['PAPER_LAYOUT_CACHE']) / (self.pdf_path.stem + '.json') if os.environ.get('PAPER_LAYOUT_CACHE') else None
        if cache is not None and cache.exists():
            self.layout = json.loads(cache.read_text())
        else:
            raw = pymupdf4llm.to_json(str(self.pdf_path), use_ocr=False, table_output='html')
            if cache is not None:
                cache.write_text(raw)
            self.layout = json.loads(raw)

    # ---- step 1: layout boxes, filled with the real text lines ----
    def collect(self):
        doc = self.doc
        self.skip_pages = set()
        t0 = doc[0].get_text().lower()
        if 'you may also like' in t0 and ('view the article online' in t0 or 'to cite this article' in t0):
            self.skip_pages.add(0)                                     # IOP cover page
        words, hyph = set(), set()
        self.page_text = {}
        for p in doc:
            t = p.get_text()
            self.page_text[p.number] = t
            u = re.sub(r'(\w)[-‐]\n(\w)', r'\1 \2', t)
            words.update(w.lower() for w in re.findall(r'[^\W\d_]+', u))
            hyph.update(w.lower() for w in re.findall(r'[^\W\d_]+(?:-[^\W\d_]+)+', u))
        self.joiner = Joiner(words, hyph)
        dic = self.joiner.dictionary
        lost = [w for w in words if dic is not None and 'f' in w and len(w) > 3 and w not in dic and w.replace('f', 'ff', 1) in dic]
        self.lig_fix = len(lost) >= 3
        self.pages = {}
        boxes = []
        for pg in self.layout['pages']:
            pno = pg['page_number'] - 1
            if pno in self.skip_pages:
                continue
            page = doc[pno]
            W, H = page.rect.width, page.rect.height
            self.pages[pno] = (W, H)
            lines = page_lines(page)
            pboxes = []
            for b in pg['boxes']:
                bx = Box(b['boxclass'], pno, [b['x0'], b['y0'], b['x1'], b['y1']], -1)
                bx.table = b.get('table')
                pboxes.append(bx)
            draws = []
            try:
                for d in page.get_drawings():
                    rr = d['rect']
                    if rr.width < 0.9 * W and rr.height < 0.9 * H and (rr.width > 0.5 or rr.height > 0.5):
                        draws.append([rr.x0, rr.y0, rr.x1, rr.y1])
            except Exception:
                pass
            images = [list(i['bbox']) for i in page.get_image_info() if i['bbox'][2] - i['bbox'][0] > 3]
            for bx in pboxes:
                # a "picture" that is only text (a caption, a paragraph): no image, (almost) no drawing inside
                if bx.cls == 'picture' and not any(area(inter(i, bx.rect)) > 0.1 * area(bx.rect) for i in images):
                    ink = [l['bbox'] for l in lines if frac_inside(l['bbox'], bx.rect) > 0.7]
                    if ink and sum(area(r) for r in ink) > 0.25 * area(bx.rect) and sum(1 for d in draws if frac_inside(d, bx.rect) > 0.8) < 3:
                        bx.cls = 'caption' if LABEL_RE.match(''.join(s_['text'] for l in lines if frac_inside(l['bbox'], bx.rect) > 0.7 for s_ in l['spans'])) else 'text'
            stops = [bx.rect for bx in pboxes if bx.cls == 'caption' or (bx.cls in ('text', 'list-item') and area(bx.rect) > 0.03 * W * H)]
            for bx in pboxes:
                if bx.cls == 'picture':
                    bx.rect = grow_picture(bx.rect, draws + images, stops, W, H)
                elif bx.cls == 'formula':
                    bx.rect = grow_formula(bx.rect, [l['bbox'] for l in lines] + draws, W)
            forms = sorted([bx for bx in pboxes if bx.cls == 'formula'], key=lambda b_: -area(b_.rect))
            for a_ in forms:
                for b_ in forms:
                    if a_ is b_ or a_.cls != 'formula' or b_.cls != 'formula':
                        continue
                    hb = min(b_.rect[3] - b_.rect[1], a_.rect[3] - a_.rect[1])
                    vov = min(a_.rect[3], b_.rect[3]) - max(a_.rect[1], b_.rect[1])
                    same_col = (a_.rect[2] < 0.56 * W) == (b_.rect[2] < 0.56 * W) and (a_.rect[0] > 0.44 * W) == (b_.rect[0] > 0.44 * W)
                    if frac_inside(b_.rect, a_.rect) > 0.6 or (vov > 0.3 * hb and same_col):
                        a_.rect = union([a_.rect, b_.rect])
                        b_.cls = 'merged-formula'
            pboxes = [bx for bx in pboxes if bx.cls != 'merged-formula']
            dirs = collections.Counter(l['dir'] for l in lines)
            self.rot = getattr(self, 'rot', {})
            top = dirs.most_common(1)[0] if dirs else ((1, 0), 0)
            self.rot[pno] = (-90 if top[0] == (0, -1) else 90 if top[0] == (0, 1) else 0) if top[1] > 0.6 * max(1, len(lines)) else 0
            self.draws = getattr(self, 'draws', {})
            self.draws[pno] = draws + images
            self.rules = getattr(self, 'rules', {})
            self.rules[pno] = [d for d in draws if d[3] - d[1] < 2 and d[2] - d[0] > 25]
            self.lines = getattr(self, 'lines', {})
            self.lines[pno] = lines
            order = sorted(pboxes, key=lambda x: 0 if x.cls not in ('picture', 'table', 'formula') else 1)
            for l in lines:
                cx, cy = (l['bbox'][0] + l['bbox'][2]) / 2, (l['bbox'][1] + l['bbox'][3]) / 2
                for bx in order:
                    r = bx.rect
                    if r[0] - 2 <= cx <= r[2] + 2 and r[1] - 2 <= cy <= r[3] + 2:
                        if bx.cls in ('picture', 'table', 'formula'):
                            l['used'] = 'region'
                        else:
                            bx.lines.append(l)
                            l['used'] = True
                        break
            # "tables" that are really running text (back matter, reference lists): give their lines back as text
            for bx in [b for b in pboxes if b.cls == 'table']:
                inside = [l for l in lines if l['used'] == 'region' and not l['rotated'] and bx.rect[0] - 2 <= (l['bbox'][0] + l['bbox'][2]) / 2 <= bx.rect[2] + 2
                          and bx.rect[1] - 2 <= (l['bbox'][1] + l['bbox'][3]) / 2 <= bx.rect[3] + 2]
                if self.prose_like(inside):
                    k = pboxes.index(bx)
                    pboxes[k:k + 1] = self.prose_boxes(inside, pno)
            # lines the layout model missed become extra text boxes, placed after the box above them
            orphans = [l for l in lines if not l['used'] and not l['rotated']]
            groups = []
            for l in sorted(orphans, key=lambda l: (l['bbox'][1], l['bbox'][0])):
                if groups and abs(l['bbox'][1] - groups[-1][-1]['bbox'][3]) < 4 and hoverlap(l['bbox'], groups[-1][-1]['bbox']) > 0.3:
                    groups[-1].append(l)
                else:
                    groups.append([l])
            for g in groups:
                txt = ''.join(s['text'] for l in g for s in l['spans']).strip()
                if len(txt) < 3 or re.fullmatch(r'[\d\s|.]+', txt):
                    continue
                bx = Box('text', pno, union([l['bbox'] for l in g]), -1)
                bx.lines, bx.synthetic = g, True
                prev = None
                for k, other in enumerate(pboxes):
                    if other.rect[3] <= bx.rect[1] + 2 and hoverlap(other.rect, bx.rect) > 0.3:
                        prev = k
                pboxes.insert(prev + 1 if prev is not None else 0, bx)
            split_boxes = []
            for bx in pboxes:
                # a box the layout model stretched over both columns although no line crosses the gutter: split it
                if bx.cls in ('text', 'list-item') and bx.rect[0] < 0.4 * W and bx.rect[2] > 0.6 * W and len(bx.lines) > 1:
                    left = [l for l in bx.lines if l['bbox'][2] < 0.52 * W]
                    right = [l for l in bx.lines if l['bbox'][0] > 0.48 * W]
                    if left and right and len(left) + len(right) == len(bx.lines):
                        for part in (left, right):
                            nb = Box(bx.cls, pno, union([l['bbox'] for l in part]), -1)
                            nb.lines = part
                            split_boxes.append(nb)
                        continue
                    if (left or right) and len(left) + len(right) == len(bx.lines):
                        bx.rect = union([l['bbox'] for l in bx.lines])      # all its lines sit in one column
                # a heading printed as the first line of a text box ("References Alexi, A., ...")
                if bx.cls == 'text' and len(bx.lines) > 2:
                    first = min(bx.lines, key=lambda l: (l['bbox'][1], l['bbox'][0]))
                    ft = ''.join(s_['text'] for s_ in first['spans']).strip()
                    if REFS_RE.match(ft) and all(is_bold(s_) for s_ in first['spans'] if s_['text'].strip()):
                        h = Box('section-header', pno, list(first['bbox']), -1)
                        h.lines = [first]
                        rest = Box('text', pno, union([l['bbox'] for l in bx.lines if l is not first]), -1)
                        rest.lines = [l for l in bx.lines if l is not first]
                        split_boxes += [h, rest]
                        continue
                split_boxes.append(bx)
            pboxes = split_boxes
            for bx in pboxes:
                self.fill(bx, W)
            boxes.extend(self.reading_order(pboxes, W))
        for i, bx in enumerate(boxes):
            bx.idx = i
        self.boxes = boxes
        sizes = collections.Counter()
        first = min(self.pages)
        for bx in boxes:
            if bx.cls == 'text' and bx.page > first and len(bx.text) > 200:
                sizes[bx.size] += len(bx.text)
        if not sizes:
            for bx in boxes:
                if bx.cls == 'text':
                    sizes[bx.size] += len(bx.text)
        self.body_size = sizes.most_common(1)[0][0] if sizes else 10
        heb = sum(1 for bx in boxes for ch in bx.text if '֐' <= ch <= '׿')
        self.hebrew = heb > 0.3 * max(1, sum(len(bx.text) for bx in boxes))

    @staticmethod
    def prose_like(lines):
        """Lines of a 'table' that are one left-aligned column of running text."""
        rows = merge_rows([dict(l) for l in lines])
        if len(rows) < 3:
            return False
        xs = collections.Counter(round(r['bbox'][0] / 4.5) for r in rows)
        anchors = [k * 4.5 for k, _ in xs.most_common(2)]      # flush-left, or a hanging indent (reference lists)
        left = sum(1 for r in rows if min(abs(r['bbox'][0] - a_) for a_ in anchors) < 5)
        texts = [''.join(s_['text'] for s_ in r['spans']).strip() for r in rows]
        for r in rows:                                  # cells side by side: a wide blank inside a row
            sp = sorted([s_ for s_ in r['spans'] if s_['text'].strip()], key=lambda s_: s_['bbox'][0])
            if any(b_['bbox'][0] - a_['bbox'][2] > 14 for a_, b_ in zip(sp, sp[1:])):
                return False
        if any(REFS_RE.match(t.strip('* ')) for t in texts):
            return True
        return left >= 0.85 * len(rows) and sum(len(t) for t in texts) / len(rows) > 30

    def prose_boxes(self, lines, pno):
        """Text boxes (and headings: short bold lines) from the lines of a false table."""
        rows = merge_rows([dict(l) for l in lines])
        out, cur = [], []

        def close():
            if cur:
                b = Box('text', pno, union([r['bbox'] for r in cur]), -1)
                b.lines = list(cur)
                for r in cur:
                    r['used'] = True
                out.append(b)
                cur.clear()
        for r in rows:
            t = ''.join(s_['text'] for s_ in r['spans']).strip()
            bold = all(is_bold(s_) for s_ in r['spans'] if s_['text'].strip())
            if bold and len(t) < 80:
                close()
                h = Box('section-header', pno, list(r['bbox']), -1)
                h.lines = [r]
                out.append(h)
                continue
            if cur and r['bbox'][1] - cur[-1]['bbox'][3] > 0.6 * (r['bbox'][3] - r['bbox'][1]):
                close()
            cur.append(r)
        close()
        for l in lines:
            l['used'] = True
        return out

    @staticmethod
    def reading_order(pboxes, W):
        """Two-column pages: left column before right column between full-width items. The layout model
        usually gets this right; the order is only changed when it put a left-column box after a right-column one."""
        def col(b):
            return 0 if b.rect[2] < 0.56 * W else 1 if b.rect[0] > 0.44 * W else 2
        body = [b for b in pboxes if b.cls in ('text', 'list-item')]
        t0 = sum(len(b.text) for b in body if col(b) == 0)
        t1 = sum(len(b.text) for b in body if col(b) == 1)
        if min(t0, t1) < 0.2 * max(1, t0 + t1):
            return pboxes
        fulls = sorted([b for b in pboxes if col(b) == 2 and b.cls not in ('page-header', 'page-footer')], key=lambda b: b.rect[1])

        def key(b):
            if b.cls in ('page-header', 'page-footer'):
                return None
            if col(b) == 2:
                return (sum(1 for f in fulls if f.rect[1] < b.rect[1] - 1) + 1, -1, b.rect[1])
            return (sum(1 for f in fulls if f.rect[3] <= b.rect[1] + 2), col(b), b.rect[1])
        ks = [(key(b), b) for b in pboxes]
        live = [(k, b) for k, b in ks if k is not None]
        bad = any(k1[0] == k2[0] and k1[1] == 1 and k2[1] == 0 for i, (k1, _) in enumerate(live) for k2, _ in live[i + 1:])
        if not bad:
            return pboxes
        order = iter(sorted(live, key=lambda kb: kb[0]))
        return [b if k is None else next(order)[1] for k, b in ks]

    def fill(self, bx, W):
        """Text of a box (markdown with bold/italic/sup/sub, hyphenation undone) from its PDF lines."""
        bx.lines = merge_rows(bx.lines)
        bx.size, bx.bold = box_style(bx)
        bx.col = 0 if bx.rect[2] < 0.56 * W else (1 if bx.rect[0] > 0.44 * W else 2)
        rtl = any('֐' <= ch <= '׿' for l in bx.lines for s in l['spans'] for ch in s['text'])
        parts = []
        for g in lines_to_groups(bx.lines):
            if rtl:
                g = [fix_rtl(x) for x in g]
            parts.append(self.joiner.join(g))
        bx.md = '\n'.join(p for p in parts if p)
        if getattr(self, 'lig_fix', False):
            bx.md = re.sub(r'(?<![\w-])[a-z]{3,}(?![\w-])', self.fix_ligature, bx.md)
        bx.text = plain(bx.md)

    def fix_ligature(self, m):
        """'diferent' -> 'different', 'eicient' -> 'efficient' (the PDF lost the ff / ffi ligature)."""
        w = m.group(0)
        lw = w.lower()
        dic = self.joiner.dictionary
        if len(w) < 4 or lw in dic:
            return w
        for i in range(1, len(w)):
            for add in ('ff', 'ffi', 'ffl', 'f', 'fi', 'fl'):
                cand = w[:i] + add + w[i:]
                if cand in dic:
                    return cand
        return w

    def inner_caption(self, reg, want):
        """The layout model sometimes puts a caption inside the table's / figure's own box (Springer prints table
        captions beside the table). Find it in the PDF lines of the region, cut it out of the region, return it."""
        pno, r = reg.page, reg.rect
        W, H = self.pages[pno]
        inside = [l for l in self.lines.get(pno, []) if l.get('used') == 'region' and not l['rotated']
                  and r[0] - 2 <= (l['bbox'][0] + l['bbox'][2]) / 2 <= r[2] + 2 and r[1] - 2 <= (l['bbox'][1] + l['bbox'][3]) / 2 <= r[3] + 2]
        if len(inside) < 2:
            return None
        inside.sort(key=lambda l: (l['bbox'][1], l['bbox'][0]))
        text = lambda l: ''.join(s['text'] for s in l['spans']).strip()
        lab = None
        for l in inside[:3] + (inside[-4:] if want == 'figure' else []):
            m = LABEL_RE.match(text(l))
            if m and m.group(1).lower().startswith('tab') == (want == 'table') and label_number(m.group(2))[0]:
                lab = l
                break
        if lab is None:
            return None
        lb = lab['bbox']
        h = lb[3] - lb[1]
        size = max(lab['spans'], key=lambda s_: len(s_['text']))['size']

        def row(a, b):
            return min(a[3], b[3]) - max(a[1], b[1]) > 0.4 * min(a[3] - a[1], b[3] - b[1])

        right = [o['bbox'][0] for o in inside if o is not lab and row(o['bbox'], lb) and o['bbox'][0] > lb[2] + 8]
        side = bool(right) and lb[0] < r[0] + 0.25 * (r[2] - r[0])
        col_x = min(right) - 4 if side else r[2] + 5
        group, prev = [lab], lab
        for l in inside[inside.index(lab) + 1:]:
            b, pb = l['bbox'], prev['bbox']
            if side and b[2] > col_x:
                continue
            if row(b, pb):
                continue
            if b[1] - pb[3] > 0.8 * h or abs(b[0] - lb[0]) > 4 or abs(max(l['spans'], key=lambda s_: len(s_['text']))['size'] - size) > 0.3:
                break
            if not side and any(o is not l and row(o['bbox'], b) for o in inside):
                break                                   # a table row, not a caption line
            if any(pb[3] - 1 <= d[1] <= b[1] + 1 and d[0] < b[2] and d[2] > b[0] for d in self.rules.get(pno, [])):
                break
            group.append(l)
            prev = l
        gr = union([l['bbox'] for l in group])
        rest = [l['bbox'] for l in inside if l not in group]
        if not rest:
            return None
        if side:
            reg.rect = [min(b[0] for b in rest) - 3, reg.rect[1], reg.rect[2], reg.rect[3]]
        elif gr[1] < (r[1] + r[3]) / 2:
            reg.rect = [reg.rect[0], gr[3] + 1, reg.rect[2], reg.rect[3]]
        else:
            reg.rect = [reg.rect[0], reg.rect[1], reg.rect[2], gr[1] - 1]
        cap = Box('caption', pno, gr, -1)
        cap.lines = [dict(l, used=True) for l in group]
        self.fill(cap, W)
        cap.kind = 'caption-used'
        return cap

    # ---- step 2: running heads, page numbers, margin notes ----
    def drop_furniture(self):
        def key(bx):
            return re.sub(r'[\d\s|]+', ' ', bx.text.lower()).strip()
        reps = collections.defaultdict(set)
        for bx in self.boxes:
            W, H = self.pages[bx.page]
            if bx.text and len(bx.text) < 160 and (bx.rect[1] < 0.1 * H or bx.rect[3] > 0.9 * H):
                reps[key(bx)].add(bx.page)
        npages = len(self.pages)
        same_place = collections.Counter(tuple(round(v / 3) for v in bx.rect) for bx in self.boxes if bx.cls == 'picture')
        for bx in self.boxes:
            W, H = self.pages[bx.page]
            if bx.cls == 'picture' and npages >= 4 and same_place[tuple(round(v / 3) for v in bx.rect)] >= max(3, 0.4 * npages):
                bx.kind = 'drop'                                        # the same picture at the same place on every page
                continue
            if bx.cls in ('page-header', 'page-footer') and LABEL_RE.match(bx.md) and len(bx.text) > 12:
                bx.cls = bx.kind = 'caption'                            # a table caption at the very top of the page
            if bx.cls in ('page-header', 'page-footer'):
                bx.kind = 'drop'
                continue
            if not bx.text and bx.cls not in ('picture', 'table', 'formula'):
                bx.kind = 'drop'
                continue
            if bx.cls in ('picture', 'table') and (bx.rect[3] < 0.065 * H or bx.rect[1] > 0.94 * H or
                                                   (bx.rect[3] - bx.rect[1] < 14 and (bx.rect[1] < 0.1 * H or bx.rect[3] > 0.9 * H))):
                bx.kind = 'drop'                                        # a running head or foot drawn as a table / image
                continue
            edge = bx.rect[1] < 0.1 * H or bx.rect[3] > 0.9 * H
            if bx.text and len(bx.text) < 160 and edge and not LABEL_RE.match(bx.md):
                if len(reps[key(bx)]) >= max(2, 0.3 * npages) or re.fullmatch(r'(page\s*)?\d+(\s*(of|/)\s*\d+)?|[ivx]+|\|?\s*\d+\s*\|?', bx.text.strip().lower()):
                    bx.kind = 'drop'
            if bx.cls == 'text' and re.fullmatch(r'\(?\d{1,3}[a-z]?\)?', bx.text.strip()):
                bx.kind = 'drop'
            if re.search(r'this content was downloaded from|downloaded from https?://|downloaded via|^vol\.?:\(0123456789\)', bx.text, re.I):
                bx.kind = 'drop'
            if re.match(r'^(?:\*\*)?(?:open access(?:\*\*)?\s+)?this article is (?:licensed|distributed) under', bx.text, re.I) and bx.page > min(self.pages):
                bx.kind = 'drop'                                        # licence boilerplate at the end (shown on the page anyway)

    # ---- step 3: front matter / body / references ----
    def split(self):
        pub = self.pub
        first_pages = sorted(self.pages)[:3]
        abs_tokens = collections.Counter(tokens(pub.get('description', '')))
        title_tokens = set(tokens(pub['name']))
        surnames = {norm(a.split()[-1]) for a in re.split(r',\s*', pub.get('authors', '')) if a.strip()}
        live = [bx for bx in self.boxes if bx.kind != 'drop']

        # sidebars: PLOS, Frontiers, MDPI and IOP print metadata down a narrow left column on the first pages
        self.side = {}
        side_key = None
        for bx in live:
            W, H = self.pages[bx.page]
            if bx.page not in first_pages[:2] or bx.cls in ('picture', 'table', 'formula'):
                continue
            wide = any(o.page == bx.page and o.rect[0] > 0.27 * W and len(o.text) > 150 for o in live)
            left_col = any(o.page == bx.page and o.rect[0] < 0.15 * W and o.rect[2] > 0.4 * W and len(o.text) > 150 for o in live)
            if wide and not left_col and bx.rect[2] < 0.37 * W and bx.rect[0] < 0.15 * W:
                bx.kind = 'side'
                for g in bx.md.split('\n'):
                    m = re.match(r'^\*\*([^*]{2,45}?):?\*\*:?\s*(.*)$', g)
                    if m:
                        side_key = plain(m.group(1)).rstrip(':').strip()
                        self.side[side_key] = plain(m.group(2))
                    elif bx.cls == 'section-header' and len(bx.text) < 40:
                        side_key = bx.text.strip().rstrip(':')
                        self.side[side_key] = ''
                    elif side_key:
                        self.side[side_key] = (self.side[side_key] + ' ' + plain(g)).strip()
        live = [bx for bx in live if bx.kind != 'side']

        def is_front(bx):
            t = bx.text.strip()
            if bx.cls == 'table':
                h = ((bx.table or {}).get('html') or '').lower()
                return bx.page == first_pages[0] and ('abstract' in h or 'a b s t r a c t' in h or 'keywords' in h or 'article info' in h)
            if not t:
                return False
            if bx.cls == 'title' or FRONT_START_RE.match(t) or id(bx) in structured:
                return True
            tk = tokens(t)
            if tk and len(t) > 25:
                inside = sum(min(c, abs_tokens[w]) for w, c in collections.Counter(tk).items())
                if inside / len(tk) > 0.72:
                    return True
            if tk and title_tokens and len(set(tk) & title_tokens) / len(title_tokens) > 0.7 and len(tk) < 2 * len(title_tokens) + 4:
                return True
            names = {norm(w) for w in re.findall(r'[^\W\d_]+', t)}
            if surnames and len(surnames & names) >= max(1, 0.5 * len(surnames)) and (len(t) < 400 or (len(t) < 1500 and len(surnames & names) >= 0.7 * len(surnames))):
                return True
            if bx.page == first_pages[0] and AFFIL_RE.search(t) and len(t) < 700 and bx.size <= self.body_size and not t.endswith(('.', ':')):
                return True
            return '@' in t and len(t) < 300

        # a structured abstract (Purpose: ... Methods: ... Results: ...) on the first page
        structured = set()
        p1 = [bx for bx in live if bx.page == first_pages[0] and bx.cls in ('text', 'list-item', 'section-header')]
        lab = [i for i, bx in enumerate(p1) if STRUCT_RE.match(bx.text)]
        if len(lab) >= 2:
            lo = lab[0]
            while lo > 0 and p1[lo - 1].cls == 'text' and not p1[lo - 1].bold and len(p1[lo - 1].text) > 150:
                lo -= 1                                     # the first part may have lost its label
            structured = {id(bx) for bx in p1[lo:lab[-1] + 1]}
        intro = next((i for i, bx in enumerate(live) if bx.page in first_pages and bx.cls in ('section-header', 'title', 'text')
                      and len(bx.text) < 80 and INTRO_RE.match(bx.text) and (bx.cls != 'text' or bx.bold)), None)
        if intro is not None:
            start = intro
        else:
            last = -1
            for i, bx in enumerate(live):
                if bx.page not in first_pages[:2]:
                    break
                if is_front(bx):
                    last = i
            start = last + 1
        front, body = live[:start], live[start:]
        if intro is None:
            # no "Introduction" heading (Nature-style papers): body paragraphs printed before the last front-matter
            # item (affiliations or a footnote at the bottom of page 1) belong to the body
            seen_abs = False
            moved = []
            for bx in front:
                bodyish = (bx.cls in ('text', 'list-item', 'section-header') and not bx.bold and abs(bx.size - self.body_size) < 0.35
                           and not FRONT_START_RE.match(bx.text) and '@' not in bx.text)
                if moved and bodyish and moved[-1].page == bx.page:
                    moved.append(bx)
                    continue
                if is_front(bx):
                    seen_abs = seen_abs or bool(re.match(r'^(?:\*\*)?\s*abstract', bx.text, re.I)) or len(bx.text) > 400
                    continue
                if seen_abs and bodyish and len(bx.text) > 200:
                    moved.append(bx)
            if moved:
                front = [bx for bx in front if bx not in moved]
                body = moved + body
        kept = []
        for bx in body:
            if bx.page in first_pages[:2] and (bx.cls == 'footnote' or (bx.cls == 'text' and len(bx.text) < 400 and (
                    '@' in bx.text or re.match(r'^(https?://doi|\*?\s*corresponding|e-?mail|received|©|copyright|available online|accepted|article history|'
                                         r'this is an open[ -]access|this article is (?:an open|licensed|distributed)|supplementa(?:l|ry) (?:material|information|data) (?:is )?available)', bx.text, re.I)))):
                front.append(bx)
                continue
            kept.append(bx)
        body = kept
        refs_at = next((i for i, bx in enumerate(body) if bx.cls in ('section-header', 'text', 'title') and len(bx.text) < 40
                        and REFS_RE.match(bx.text.strip().strip('*').strip())), None)
        rest = None
        if refs_at is not None:
            rest, body = body[refs_at + 1:], body[:refs_at]
        else:
            # no heading: a run of "[1] ...", "[2] ..." items towards the end
            for i in range(int(len(body) * 0.25), len(body)):
                if re.match(r'^\s*\[1\]\s+\S', body[i].text) and any(re.match(r'^\s*\[2\]', b.text) or '[2]' in b.text[:400] for b in body[i:i + 4]):
                    rest, body = body[i:], body[:i]
                    break
        refs, tail = [], []
        if rest is not None:
            for j, bx in enumerate(rest):
                if re.match(r'^(disclaimer/publisher|publisher[’\']s note|springer nature remains neutral)', bx.text, re.I):
                    bx.kind = 'drop'                    # publisher boilerplate, sometimes printed inside the reference list
                    continue
                if (bx.cls == 'section-header' and AFTER_REFS_RE.match(bx.text)) or re.match(r'^disclaimer', bx.text, re.I):
                    tail = rest[j:]
                    break
                refs.append(bx)
        self.front, self.body, self.refs_boxes, self.tail = front, body, refs, tail
        self.front_text = '\n'.join(self.page_text[p] for p in first_pages[:2])

    # ---- step 4: figures, tables, equations ----
    def regions(self, out):
        boxes = self.body + self.tail
        self.figures, self.tables, self.equations = {}, {}, {}
        self.region_of = {}
        for bx in boxes:                    # "Table 3" on its own line, the title in the box below it (Elsevier)
            if re.fullmatch(r'\s*(fig\.?|figure|table|tab\.|algorithm)\s*[\w.]{1,6}\s*[.:|]?\s*', bx.text or '', re.I):
                below = [o for o in boxes if o is not bx and o.page == bx.page and o.kind == o.cls and o.cls in ('text', 'caption', 'section-header')
                         and -1 <= o.rect[1] - bx.rect[3] < 8 and abs(o.rect[0] - bx.rect[0]) < 6 and abs(o.size - bx.size) < 2.2 and len(o.text) < 900]
                if below:
                    o = min(below, key=lambda o: o.rect[1])
                    bx.md = bx.md.rstrip() + ' ' + o.md
                    bx.text = plain(bx.md)
                    bx.rect = union([bx.rect, o.rect])
                    bx.cls = 'caption'
                    o.kind = 'drop'
        for bx in boxes:                    # a whole table (with its caption) read as one text box
            m = LABEL_RE.match(bx.md or '')
            if m and m.group(1).lower().startswith('tab') and bx.cls == 'text' and bx.kind == 'text':
                originals = [l for l in self.lines.get(bx.page, []) if frac_inside(l['bbox'], bx.rect) > 0.7]
                rows = collections.defaultdict(list)
                for l in originals:
                    rows[round((l['bbox'][1] + l['bbox'][3]) / 4)].append(l['bbox'])
                wide = sum(1 for r in rows.values() if any(b2[0] - b1[2] > 14 for b1, b2 in zip(sorted(r), sorted(r)[1:])))
                if wide >= 3:
                    for l in originals:
                        l['used'] = 'region'
                    bx.cls, bx.kind, bx.table = 'table', 'table', None
        for bx in boxes:
            m = LABEL_RE.match(bx.md or '')
            if m and bx.cls in ('caption', 'text', 'footnote', 'section-header', 'list-item'):
                strong = bx.cls == 'caption' or bx.md.lstrip().startswith('**') or bx.size < self.body_size - 0.3 or m.group(3) in ('.', ':', '|')
                if m.group(1).lower() in ('algorithm', 'listing'):
                    strong = len(bx.text) < 160 and bx.cls in ('caption', 'section-header', 'text')
                verb = re.match(r'^\s*(fig\.?|figure|table|algorithm)\s*\d+\s+(shows|presents|illustrates|summari[sz]es|depicts|reports|lists|provides|gives|displays|'
                                r'compares|contains|indicates|outlines|describes|demonstrates|reveals|highlights|details)\b', bx.text, re.I)
                if strong and not verb:
                    bx.kind = 'caption-' + ('figure' if m.group(1).lower().startswith('fig') else 'table')     # algorithms are placed like tables
        by_page = collections.defaultdict(list)
        for bx in boxes:
            by_page[bx.page].append(bx)

        def side_dist(reg, cap, W):
            vov = min(reg.rect[3], cap.rect[3]) - max(reg.rect[1], cap.rect[1])
            side_gap = max(cap.rect[0] - reg.rect[2], reg.rect[0] - cap.rect[2])
            if vov > 0.3 * (cap.rect[3] - cap.rect[1]) and -5 < side_gap < 0.25 * W:
                return side_gap + 10                # caption printed beside the figure / table
            return None

        def fig_dist(pic, cap):
            W, H = self.pages[pic.page]
            if hoverlap(pic.rect, cap.rect) < 0.25:
                return side_dist(pic, cap, W)
            if cap.rect[1] >= pic.rect[3] - 8:
                return cap.rect[1] - pic.rect[3]
            if cap.rect[3] <= pic.rect[1] + 8:
                return (pic.rect[1] - cap.rect[3]) * 1.6 + 20
            return 30

        def tab_dist(tb, cap):
            W, H = self.pages[tb.page]
            if self.rot.get(tb.page):
                return abs((cap.rect[0] + cap.rect[2]) / 2 - (tb.rect[0] + tb.rect[2]) / 2) / 10
            if hoverlap(tb.rect, cap.rect) < 0.25:
                return side_dist(tb, cap, W)
            if cap.rect[3] <= tb.rect[1] + 8:
                return tb.rect[1] - cap.rect[3]
            if cap.rect[1] >= tb.rect[3] - 8:
                return (cap.rect[1] - tb.rect[3]) * 1.5 + 15
            return 40

        def nearest(reg, caps, dist, used=()):
            best, bestd = None, 1e9
            for cap in caps:
                if cap.idx in used:
                    continue
                d = dist(reg, cap)
                if d is not None and d < bestd:
                    best, bestd = cap, d
            return best, bestd

        fig_seq = tab_seq = eq_seq = 0
        pre_caps = {}
        for pno in sorted(by_page):
            pbs = by_page[pno]
            W, H = self.pages[pno]
            caps_f = [b for b in pbs if b.kind == 'caption-figure']
            caps_t = [b for b in pbs if b.kind == 'caption-table']
            pics = [b for b in pbs if b.cls == 'picture' and b.kind != 'drop' and area(b.rect) > 0.012 * W * H
                    and not (b.rect[1] < 0.045 * H and b.rect[3] - b.rect[1] < 0.08 * H)]
            tabs = [b for b in pbs if b.cls == 'table' and b.kind != 'drop']
            for pic in list(pics):
                # a table typeset as an image (or found as a picture): its nearest caption says "Table"
                twin = next((t for t in tabs if area(inter(t.rect, pic.rect)) > 0.6 * min(area(t.rect), area(pic.rect))), None)
                if twin is not None:            # the same region found as both a table and a picture: the captions decide
                    _, df = nearest(pic, caps_f, fig_dist)
                    _, dt = nearest(twin, caps_t, tab_dist)
                    if df < dt:
                        twin.kind = 'drop'
                        tabs.remove(twin)
                    else:
                        if area(pic.rect) > area(twin.rect):
                            twin.rect = pic.rect
                        pic.kind = 'drop'
                        pics.remove(pic)
                        continue
                _, df = nearest(pic, caps_f, fig_dist)
                _, dt = nearest(pic, caps_t, tab_dist)
                if dt < 0.5 * H and dt < df:
                    pic.cls, pic.kind, pic.table = 'table', 'table', None
                    pics.remove(pic)
                    tabs.append(pic)
                elif df > 30:
                    own = self.inner_caption(pic, 'table')      # a table typeset as an image, its caption inside the box
                    if own is not None:
                        pic.cls, pic.kind, pic.table = 'table', 'table', None
                        pics.remove(pic)
                        tabs.append(pic)
                        pre_caps[id(pic)] = own
            for tb in list(tabs):
                # a figure found as a table: its nearest caption says "Figure"
                _, dt = nearest(tb, caps_t, tab_dist)
                fc, df = nearest(tb, caps_f, fig_dist)
                below_or_beside = fc is not None and (fc.rect[1] >= tb.rect[3] - 8 or hoverlap(tb.rect, fc.rect) < 0.25)
                if df < 0.6 * H and df < dt and below_or_beside and not self.rot.get(pno):
                    own = self.inner_caption(tb, 'table')
                    if own is not None:
                        pre_caps[id(tb)] = own
                        continue
                    tb.cls, tb.kind = 'picture', 'picture'
                    tabs.remove(tb)
                    pics.append(tb)
            for tb in list(tabs):
                over = sorted([c for c in caps_t if 0 <= tb.rect[1] - c.rect[3] < 30 and hoverlap(tb.rect, c.rect) > 0.5], key=lambda c: c.rect[0])
                if len(over) >= 2 and all(a_.rect[2] < b_.rect[0] for a_, b_ in zip(over, over[1:])) and tb.rect[2] - tb.rect[0] > 0.6 * W:
                    cuts = [tb.rect[0]] + [c.rect[0] - 4 for c in over[1:]] + [tb.rect[2]]
                    parts = []
                    for x0, x1 in zip(cuts, cuts[1:]):
                        part = Box('table', pno, [x0, tb.rect[1], x1, tb.rect[3]], tb.idx)
                        part.kind, part.table = 'table', None
                        parts.append(part)
                    k = pbs.index(tb)
                    pbs[k:k + 1] = parts
                    tabs.remove(tb)
                    tabs.extend(parts)
                    self.split_parts = getattr(self, 'split_parts', {})
                    self.split_parts[id(tb)] = parts
            tabs.sort(key=lambda b: (b.rect[1], b.rect[0]))
            assign, cap_of = collections.defaultdict(list), {}
            for pic in pics:
                best, bestd = nearest(pic, caps_f, fig_dist)
                if best is not None and bestd < 0.6 * H:
                    assign[best.idx].append(pic)
                    cap_of[best.idx] = best
                else:
                    assign[('solo', pic.idx)].append(pic)
            for cap in caps_f:                      # a caption without a picture: vector art above it
                if cap.idx in assign:
                    continue
                above = [b for b in pbs if b is not cap and b.rect[3] <= cap.rect[1] + 2 and hoverlap(b.rect, cap.rect) > 0.3
                         and b.cls != 'picture' and b.kind != 'drop' and len(b.text) > 60]
                top = max([b.rect[3] for b in above] + [0.06 * H])
                zone = [cap.rect[0], top + 2, cap.rect[2], cap.rect[1] - 2]
                art = [d for d in self.draws.get(pno, []) if frac_inside(d, zone) > 0.8]
                if cap.rect[1] - top > 50 and len(art) >= 3:
                    zone = union(art)
                    zone = [min(zone[0], cap.rect[0]), zone[1], max(zone[2], cap.rect[2]), zone[3]]
                    fake = Box('picture', pno, zone, -1)
                    assign[cap.idx].append(fake)
                    cap_of[cap.idx] = cap
                    continue
                frames = [d for d in self.draws.get(pno, []) if 0 <= cap.rect[1] - d[3] < 25 and d[3] - d[1] > 30
                          and d[2] - d[0] > 0.5 * (cap.rect[2] - cap.rect[0]) and hoverlap(d, cap.rect) > 0.5]
                if frames:                          # a framed block (a prompt, a listing) right above the caption
                    fr = max(frames, key=area)
                    fake = Box('picture', pno, list(fr), -1)
                    assign[cap.idx].append(fake)
                    cap_of[cap.idx] = cap
            for key in sorted(assign, key=lambda k: min(p.rect[1] for p in assign[k])):
                pl = assign[key]
                cap = cap_of.get(key)
                if cap is None and len(pl) == 1:
                    cap = self.inner_caption(pl[0], 'figure')     # the caption may sit inside the picture's box
                reg = union([p.rect for p in pl])
                if cap is not None and frac_inside(cap.rect, reg) > 0.6:      # the picture box also covers its caption
                    if cap.rect[1] > (reg[1] + reg[3]) / 2:
                        reg = [reg[0], reg[1], reg[2], cap.rect[1] - 2]
                    elif cap.rect[3] < (reg[1] + reg[3]) / 2:
                        reg = [reg[0], cap.rect[3] + 2, reg[2], reg[3]]
                lo = cap.rect[1] if cap is not None and cap.rect[1] >= reg[3] - 8 else reg[3]
                for b in pbs:                         # labels and sub-captions between the pictures and the caption
                    if b.kind.startswith('caption') or b in pl or b.kind == 'drop':
                        continue
                    if frac_inside(b.rect, [reg[0] - 4, reg[1] - 4, reg[2] + 4, max(reg[3], lo) + 2]) > 0.6 and (len(b.text) < 220 or b.size < self.body_size - 0.5):
                        reg = union([reg, b.rect])
                        b.kind = 'in-figure'
                for b in pbs:
                    if b.kind in ('in-figure', 'drop') or b.kind.startswith('caption') or b in pl:
                        continue
                    if b.cls in ('text', 'list-item', 'section-header', 'formula', 'footnote') and frac_inside(b.rect, reg) > 0.7:
                        if len(b.text) > 300 and b.size >= self.body_size - 0.3:
                            continue                  # a body paragraph next to the figure, not part of it
                        b.kind = 'in-figure'
                if cap is None and area(reg) < 0.05 * W * H:
                    for p in pl:
                        p.kind = 'drop'
                    continue
                fid = ''
                if cap is not None:
                    n, suf = label_number(LABEL_RE.match(cap.md).group(2))
                    fid = f'fig-{n}{suf}' if n else ''
                fid = fid or f'fig-x{fig_seq + 1}'
                while fid in self.figures:
                    fid += 'b'
                fig_seq += 1
                size = render_region(self.doc, pno, [reg[0] - 2, reg[1] - 2, reg[2] + 2, reg[3] + 2], out / 'figures' / f'{fid}.webp', rotate=self.rot.get(pno, 0))
                self.figures[fid] = {'id': fid, 'caption': cap.md if cap else '', 'size': size, 'page': pno}
                for p in pl:
                    p.kind = 'figure'
                anchor = min(pl, key=lambda b: b.idx if b.idx >= 0 else 10 ** 9)
                if anchor.idx < 0 and cap is not None and cap.idx >= 0:
                    anchor = cap
                if cap is not None:
                    cap.kind = 'caption-used'
                anchor.kind = 'figure-anchor'
                self.region_of[id(anchor)] = fid
            # tables
            used_caps = set()
            for tb in tabs:
                cap = pre_caps.get(id(tb)) or self.inner_caption(tb, 'table')      # its own caption inside its box comes first
                if cap is None:
                    best, bestd = nearest(tb, caps_t, tab_dist, used_caps)
                    cap = best if best is not None and bestd < 0.5 * H else None
                if cap is not None:
                    used_caps.add(cap.idx)
                tid, algo = '', False
                if cap is not None:
                    lm = LABEL_RE.match(cap.md)
                    n, suf = label_number(lm.group(2))
                    algo = lm.group(1).lower() in ('algorithm', 'listing')
                    tid = f'{"alg" if algo else "table"}-{n}{suf}' if n else ''
                tid = tid or f'table-x{tab_seq + 1}'
                while tid in self.tables:
                    tid += 'b'
                tab_seq += 1
                notes, y = [], tb.rect[3]
                below = sorted([b for b in pbs if b.rect[1] >= tb.rect[3] - 3 and hoverlap(b.rect, tb.rect) > 0.4 and b.cls in ('text', 'footnote', 'list-item')
                                and b.kind == b.cls], key=lambda b: b.rect[1])
                for b in below:
                    if b.rect[1] - y > 22 or b.size >= self.body_size - 0.2:
                        break
                    notes.append(b)
                    b.kind = 'table-note'
                    y = b.rect[3]
                for b in pbs:
                    if b is not tb and b.cls in ('text', 'list-item', 'section-header', 'formula', 'footnote') and b.kind == b.cls and frac_inside(b.rect, tb.rect) > 0.7:
                        b.kind = 'in-table'
                html_t = '' if self.rot.get(pno) or algo else self.table_html(tb, cap)
                entry = {'id': tid, 'caption': cap.md if cap else '', 'page': pno,
                         'notes': [re.sub(r'\s*https?://doi\.org/\S+$', '', n.md) for n in notes]}
                if html_t:
                    entry['html'] = html_t
                else:
                    entry['image'] = render_region(self.doc, pno, [tb.rect[0] - 3, tb.rect[1] - 3, tb.rect[2] + 3, tb.rect[3] + 3], out / 'figures' / f'{tid}.webp',
                                                   rotate=self.rot.get(pno, 0))
                self.tables[tid] = entry
                tb.kind = 'table'
                self.region_of[id(tb)] = tid
                if cap is not None:
                    cap.kind = 'caption-used'
            # display equations become images (they are exact that way)
            for b in pbs:
                if b.cls == 'formula' and b.kind == 'formula':
                    eq_seq += 1
                    eid = f'eq-{eq_seq}'
                    size = render_region(self.doc, pno, [b.rect[0] - 2, b.rect[1] - 3, b.rect[2] + 2, b.rect[3] + 3], out / 'figures' / f'{eid}.webp',
                                         max_width=1400, max_dpi=240)
                    inside = [l for l in self.lines.get(pno, []) if frac_inside(l['bbox'], b.rect) > 0.5]
                    alt = re.sub(r'\s+', ' ', ' '.join(''.join(s_['text'] for s_ in l['spans']) for l in inside)).strip()
                    self.equations[eid] = {'id': eid, 'size': size, 'alt': alt[:300]}
                    b.kind = 'equation'
                    self.region_of[id(b)] = eid
        for bx in boxes:                    # captions that found nothing stay in the text
            if bx.kind in ('caption-figure', 'caption-table'):
                bx.kind = bx.cls

    @staticmethod
    def strip_caption(h):
        """Remove a caption the layout model read as a table row (above) or column (Springer, beside)."""
        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', h, re.S)
        grid = [re.findall(r'<(t[dh])([^>]*)>(.*?)</t[dh]>', r, re.S) for r in rows]
        if not grid or not grid[0]:
            return h
        txt = lambda c: re.sub(r'<[^>]+>', ' ', c[2]).strip()
        is_cap = lambda c: bool(LABEL_RE.match(txt(c))) and len(txt(c)) > 8
        spans = 'span' in h
        if sum(1 for c in grid[0] if txt(c)) == 1 and is_cap(next(c for c in grid[0] if txt(c))):
            grid = grid[1:]
        elif not spans:
            for j, c in enumerate(grid[0]):
                if is_cap(c) and all(len(r) == len(grid[0]) and not txt(r[j]) for r in grid[1:]):
                    grid = [r[:j] + r[j + 1:] for r in grid]
                    break
            else:
                return h
        else:
            return h
        return '<table>' + ''.join('<tr>' + ''.join(f'<{t}{a}>{x}</{t}>' for t, a, x in r) + '</tr>' for r in grid if r) + '</table>'

    def table_html(self, tb, cap=None):
        t = tb.table or {}
        h = t.get('html') or ''
        if not h or (t.get('col_count') or 0) < 2 or (t.get('row_count') or 0) < 2:
            return ''
        if cap is not None:
            h = self.strip_caption(h)
        if re.search(r'[\x00-\x08\x0b-\x1f\ue000-\uf8ff\ufffd¼½þÞð]', h):
            return ''                                   # characters the layout model could not decode: show the image
        cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', h, re.S)
        if not cells or sum(1 for c in cells if not c.strip()) > 0.6 * len(cells):
            return ''
        if sum(1 for c in cells if c.count('<br') >= 2) > 0.2 * len(cells):
            return ''
        words = collections.Counter(tokens(self.doc[tb.page].get_text('text', clip=pymupdf.Rect(tb.rect))))
        got = collections.Counter(tokens(re.sub(r'<[^>]+>', ' ', h)))
        if words and sum((words & got).values()) / sum(words.values()) < 0.92:
            return ''
        if got and sum((words & got).values()) / sum(got.values()) < 0.92:      # words glued together
            return ''
        return re.sub(r'<tr>((?:<td>[^<]*</td>)(?:<td></td>)+)</tr>', r'<tr class="row-group">\1</tr>', h)

    # ---- step 5: the flow of the paper ----
    def flow(self):
        blocks, pending = [], []
        open_par = False
        heading_sizes = sorted({bx.size for bx in self.body + self.tail if bx.cls == 'section-header' and bx.kind == 'section-header'}, reverse=True)
        seen_first = set()
        footnotes = []

        def flush():
            nonlocal pending
            blocks.extend(pending)
            pending = []

        split = getattr(self, 'split_parts', {})
        for bx in self.body + self.tail:
            k = bx.kind
            if id(bx) in split:                 # one table box that held two tables
                for part in split[id(bx)]:
                    if id(part) in self.region_of:
                        (pending if open_par else blocks).append({'type': 'table', 'id': self.region_of[id(part)]})
                continue
            if k in ('drop', 'in-figure', 'in-table', 'table-note', 'caption-used', 'figure', 'side'):
                continue
            if k in ('figure-anchor', 'table'):
                if id(bx) not in self.region_of:
                    continue
                ref = self.region_of[id(bx)]
                item = {'type': 'figure' if ref.startswith('fig') else 'table', 'id': ref}
                (pending if open_par else blocks).append(item)
                continue
            if k == 'equation':
                blocks.append({'type': 'equation', 'id': self.region_of[id(bx)]})
                continue
            text = bx.md.strip()
            if not text:
                continue
            if bx.cls == 'footnote' and bx.size < self.body_size - 0.5:
                footnotes.append(text)
                continue
            heading = bx.cls in ('section-header', 'title') and len(bx.text) <= 120 and not re.match(r'^[^:]{2,40}:\s+\S', bx.text) \
                and not bx.text.rstrip().endswith((',', ';')) and len(bx.text) > 1
            if not heading and bx.cls == 'text' and bx.bold and len(bx.text) < 90 and '\n' not in bx.md \
                    and re.match(r'^((\d+\.)+\d*|\d+|[IVX]+\.|[A-Z]\.)\s+[A-Z]', bx.text) and not bx.text.rstrip().endswith('.'):
                heading = True
            if heading:
                flush()
                open_par = False
                name = re.sub(r'\s+', ' ', bx.text).strip().rstrip('.').strip()
                if name.isupper() and len(name) > 4:
                    name = re.sub(r"[A-Za-z][A-Za-z'’]*", lambda m: m.group(0).lower() if m.group(0).lower() in STOP else m.group(0).capitalize(), name.lower())
                    name = name[0].upper() + name[1:]
                m = re.match(r'^((?:\d+\.)*\d+)\.?\s+\S', name)
                if m:
                    level = 1 + min(m.group(1).count('.') + 1, 3)
                elif re.match(r'^[IVX]+\.\s', name):
                    level = 2
                elif re.match(r'^[A-H]\.\s', name):
                    level = 3
                else:
                    level = 2 + min(heading_sizes.index(bx.size) if bx.size in heading_sizes else 0, 2)
                    if bx.size < self.body_size - 0.2:
                        level = max(level, 3)
                blocks.append({'type': 'heading', 'level': min(level, 4), 'text': name})
                continue
            if bx.cls == 'list-item' or re.match(r'^[•●▪◦■]\s', bx.text):
                flush()
                for g in text.split('\n'):
                    g = re.sub(r'^[•●▪◦■–-]\s*', '', g.strip())
                    if g:
                        blocks.append({'type': 'li', 'text': g})
                open_par = False
                continue
            first = bx.page not in seen_first
            seen_first.add(bx.page)
            prev = blocks[-1] if blocks and blocks[-1]['type'] == 'p' else None
            cont = open_par and prev is not None and (text[:1].islower() or text[:1].isdigit() or prev['text'].endswith('-')
                                                     or first or bx.col != prev.get('col') or text[:1] in '([')
            parts = text.split('\n')
            if cont:
                sep = '' if prev['text'].endswith('-') and text[:1].islower() else ' '
                prev['text'] = prev['text'] + sep + parts[0]
                parts = parts[1:]
            for ptxt in parts:
                blocks.append({'type': 'p', 'text': ptxt})
            if blocks and blocks[-1]['type'] == 'p':
                blocks[-1]['col'] = bx.col
                open_par = not plain(blocks[-1]['text']).rstrip().endswith(TERMINAL)
            if not open_par:
                flush()
        flush()
        self.blocks, self.footnotes = blocks, footnotes

    # ---- step 6: references ----
    def references(self):
        groups = collections.defaultdict(list)
        for bx in self.refs_boxes:
            if bx.kind == 'drop' or bx.cls in ('picture', 'table', 'formula'):
                continue
            W = self.pages[bx.page][0]
            for l in bx.lines:
                groups[(bx.page, 0 if l['bbox'][0] < 0.45 * W else 1)].append(l)
        lines = []
        for key in sorted(groups):                     # merge hanging numbers with their text, column by column
            lines.extend((key[0], l) for l in merge_rows(groups[key]))
        self.refs, self.ref_style = [], ''
        if not lines:
            return
        page_links = {p: [(pymupdf.Rect(k['from']), k['uri']) for k in self.doc[p].get_links() if k.get('uri')] for p in {pno for pno, _ in lines}}
        texts = [(pno, l, runs_to_md(line_runs(l))) for pno, l in lines]
        m_br = [re.match(r'^\s*\[(\d{1,3})\]', plain(t)) for _, _, t in texts]
        m_dot = [re.match(r'^\s*(\d{1,3})(?:[.)]?\s+(?=\S)|[.)](?=[^\W\d_])|[.)]?\s*$)', plain(t)) for _, _, t in texts]
        def run_length(marks):
            last, run = 0, 0
            for m in marks:
                if m and int(m.group(1)) == last + 1:
                    last, run = last + 1, run + 1
            return run
        refs, cur = [], None
        rb, rd = run_length(m_br), run_length(m_dot)
        if max(rb, rd) >= 3:
            style, marks = 'num', (m_br if rb >= rd else m_dot)
            expect = None
            for (pno, l, t), m in zip(texts, marks):
                n = int(m.group(1)) if m else None
                if m and (expect is None or n == expect):
                    if cur:
                        refs.append(cur)
                    cur = {'n': n, 'lines': [], 'where': []}
                    t = re.sub(r'^\s*(\*\*)?\[?\d{1,3}[\].)]?(\*\*)?\s*', '', t, count=1)
                    expect = n + 1
                if cur is None:
                    cur = {'n': None, 'lines': [], 'where': []}
                cur['lines'].append(t)
                cur['where'].append((pno, l['bbox']))
        else:
            style = 'ay'
            def col(pno, l):
                return 0 if l['bbox'][0] < 0.48 * self.pages[pno][0] else 1
            left = collections.defaultdict(lambda: 1e9)
            for pno, l, t in texts:
                k = (pno, col(pno, l))
                left[k] = min(left[k], l['bbox'][0])
            indented = sum(1 for pno, l, t in texts if l['bbox'][0] > left[(pno, col(pno, l))] + 3)
            prev_t = ''
            for pno, l, t in texts:
                at_left = l['bbox'][0] <= left[(pno, col(pno, l))] + 3
                if indented >= 2:
                    new = at_left
                else:
                    new = prev_t.rstrip().endswith('.') and re.match(r"^[A-Z][^\W\d_'’-]+[,\s]", plain(t)) is not None
                if new or cur is None:
                    if cur:
                        refs.append(cur)
                    cur = {'n': None, 'lines': [], 'where': []}
                cur['lines'].append(t)
                cur['where'].append((pno, l['bbox']))
                prev_t = plain(t)
        if cur:
            refs.append(cur)
        out = []
        for r in refs:
            text = self.joiner.join(r['lines'])
            links = []
            for pno, bb in r['where']:
                lr = pymupdf.Rect(bb)
                for rect, uri in page_links.get(pno, []):
                    if rect.intersects(lr) and uri not in links:
                        links.append(uri)
            for u in links:
                if u not in text:
                    for cut in range(8, len(u)):
                        b2 = u[:cut] + ' ' + u[cut:]
                        if b2 in text:
                            text = text.replace(b2, u)
                            break
            pt = plain(text)
            pt = re.sub(r'\s*\[(CrossRef|PubMed|Google Scholar|Green Version|Scopus|Web of Science|PMC free article|Ref list|Full text|DOI)\]', '', pt, flags=re.I)
            pt = re.sub(r'\s*(CrossRef|Google Scholar|PubMed)(\s+(CrossRef|Google Scholar|PubMed))*\s*$', '', pt)
            doi = re.search(r'(?:https?://(?:dx\.)?doi\.org/|doi:\s*)(10\.\d{4,9}/[^\s<>]+?)(?=[.,;]?\s|[.,;]?$)', pt, re.I)
            doi = doi.group(1).rstrip('.') if doi else next((re.sub(r'^https?://(dx\.)?doi\.org/', '', u) for u in links if 'doi.org/10.' in u), '')
            pmid = re.search(r'PMID:?\s*(\d{5,9})', pt)
            urls = [u for u in links if 'doi.org' not in u and 'pubmed' not in u and 'ncbi.nlm.nih.gov' not in u and u.startswith('http')][:2]
            out.append({'n': r['n'], 'text': pt, 'doi': doi, 'pmid': pmid.group(1) if pmid else '', 'urls': urls})
        self.refs, self.ref_style = out, style

    # ---- step 7: write ----
    def write(self, out, slug, old):
        pub = self.pub
        md = []
        for b in self.blocks:
            t = b['type']
            if t == 'heading':
                md.append('#' * b['level'] + ' ' + b['text'])
            elif t == 'p':
                line = re.sub(r'^(\d+)\.(\s)', r'\1\\.\2', b['text'])
                line = re.sub(r'^([#>+\-=|])', r'\\\1', line)
                md.append(line)
            elif t == 'li':
                md.append('- ' + b['text'])
            elif t == 'figure':
                f = self.figures[b['id']]
                cap = re.sub(r'\s*https?://doi\.org/\S+$', '', f['caption'] or '').strip()
                capp = plain(cap)
                lab = LABEL_RE.match(capp)
                alt = (capp[lab.end():] if lab else capp).strip(' .:|')
                alt = re.split(r'(?<=[.!?])\s', alt)[0].rstrip('.')[:200] or 'Figure'
                w, h = display_size(f['size'], 1.6)
                md.append(f'<figure id="{f["id"]}">\n<img src="figures/{f["id"]}.webp" width="{w}" height="{h}" alt="{html.escape(alt)}" loading="lazy" decoding="async">\n'
                          + (f'<figcaption>{html_inline(cap)}</figcaption>\n' if cap else '') + '</figure>')
            elif t == 'table':
                tb = self.tables[b['id']]
                cap = html_inline(re.sub(r'\s*https?://doi\.org/\S+$', '', tb['caption'])) if tb['caption'] else ''
                notes = ''.join(f'<p class="table-note">{html_inline(n)}</p>' for n in tb['notes'])
                if tb.get('html'):
                    inner = f'<div class="table-scroll">{tb["html"]}</div>'
                else:
                    w, h = display_size(tb['image'], 1.45)
                    inner = f'<img src="figures/{tb["id"]}.webp" width="{w}" height="{h}" alt="{html.escape(plain(tb["caption"])[:200] or "Table")}" loading="lazy" decoding="async">'
                md.append(f'<figure class="table-figure" id="{tb["id"]}">\n' + (f'<figcaption>{cap}</figcaption>\n' if cap else '') + f'{inner}\n{notes}\n</figure>')
            elif t == 'equation':
                e = self.equations[b['id']]
                w, h = display_size(e['size'], 1.35)
                md.append(f'<div class="equation" id="{e["id"]}"><img src="figures/{e["id"]}.webp" width="{w}" height="{h}" alt="{html.escape(e["alt"] or "equation")}" loading="lazy" decoding="async"></div>')
        body = ''
        for i, x in enumerate(md):
            if not x:
                continue
            if body:
                body += '\n' if x.startswith('- ') and md[i - 1].startswith('- ') else '\n\n'
            body += x
        if self.footnotes:
            body += '\n\n## Notes\n\n' + '\n\n'.join(self.footnotes)
        if self.refs:
            body += '\n\n## References\n\n'
            for i, r in enumerate(self.refs):
                extra = []
                if r['doi']:
                    extra.append(f'[doi:{r["doi"]}](https://doi.org/{r["doi"].replace("(", "%28").replace(")", "%29")})')
                if r['pmid']:
                    extra.append(f'[PubMed {r["pmid"]}](https://pubmed.ncbi.nlm.nih.gov/{r["pmid"]}/)')
                for u in r['urls']:
                    if r['doi'] and r['doi'].lower() in u.lower():
                        continue
                    extra.append(f'[link]({u.replace("(", "%28").replace(")", "%29").replace(" ", "%20")})')
                text = r['text']
                if r['doi']:
                    text = re.sub(r'\s*(?:https?://(?:dx\.)?doi\.org/|doi:\s*)' + re.escape(r['doi']) + r'\.?', '', text, flags=re.I)
                text = re.sub(r'\s*PMID:?\s*\d+\s*', ' ', text).strip()
                text = md_escape(text)
                if self.ref_style == 'num':
                    n = r['n'] if r['n'] is not None else i + 1
                    body += f'{n}. {text}' + (' ' + ' · '.join(extra) if extra else '') + '\n'
                else:
                    body += f'- {text}' + (' ' + ' · '.join(extra) if extra else '') + '\n'
        body = body.strip() + '\n'
        (out / 'paper.md').write_text(body, encoding='utf-8')

        names = [a.strip() for a in re.split(r',\s*', pub.get('authors', '')) if a.strip()]
        authors = [{'name': n, 'given': ' '.join(n.split()[:-1]), 'family': n.split()[-1]} for n in names]
        fm = parse_front(self.front_text + '\n' + '\n'.join(f'{k}: {v}' for k, v in self.side.items()), self.side)
        doi = find_doi(self.front_text) or find_doi(self.doc.metadata.get('subject') or '')
        vol, issue, pages = volume_info(self.front_text)
        alltext = ' '.join(self.page_text.values())
        m = re.search(r'creativecommons\.org/licen[sc]es/([a-z-]+)/(\d\.\d)', alltext)
        lic = f'https://creativecommons.org/licenses/{m.group(1)}/{m.group(2)}/' if m else ''
        if not lic and re.search(r'Creative Commons Attribution[- ]Non ?-?Commercial', alltext, re.I):
            lic = 'https://creativecommons.org/licenses/by-nc/4.0/'
        elif not lic and re.search(r'Creative Commons Attribution', alltext, re.I):
            lic = 'https://creativecommons.org/licenses/by/4.0/'
        meta = {
            'title': pub['name'], 'pub_type': pub.get('type', 'Paper'), 'short_title': '', 'authors': authors, 'affiliations': self.affiliations(),
            'journal': pub.get('publisher', ''), 'year': pub.get('year'), 'volume': vol, 'issue': issue, 'pages': pages, 'doi': doi,
            'published': fm.get('published', ''), 'received': fm.get('received', ''), 'accepted': fm.get('accepted', ''),
            'abstract': re.sub(r'\s+', ' ', pub.get('description', '')).strip(), 'keywords': fm.get('keywords', []),
            'license': {'url': lic, 'name': 'CC ' + m.group(1).upper() + ' ' + m.group(2) if m else ('CC BY-NC' if 'by-nc' in lic else 'CC BY' if lic else '')} if lic else {},
            'funding': fm.get('funding', ''), 'competing_interests': fm.get('competing_interests', ''),
            'data_availability': fm.get('data_availability', ''), 'editor': fm.get('editor', ''), 'abbreviations': fm.get('abbreviations', []),
            'summary': '', 'key_findings': [], 'key_numbers': [], 'featured_figure': '', 'related_project': '',
            'pdf_url': PDF_URL_BASE + next((l['link'] for l in pub['fileLinks'] if l.get('type') == 1), ''),
            'slug': slug, 'lang': 'he' if self.hebrew else 'en', 'reviewed': False,
        }
        for k in KEEP_FIELDS:
            if old.get(k):
                meta[k] = old[k]
        if meta['featured_figure'] not in self.figures:
            figs = sorted(self.figures.values(), key=lambda f: (0 if re.match(r'fig-\d', f['id']) else 1, f['size'][2] * f['size'][3] < 40000))
            meta['featured_figure'] = figs[0]['id'] if figs else ''
        meta['extracted'] = {
            'with': f'pymupdf4llm {pymupdf4llm.__version__}, PyMuPDF {pymupdf.VersionBind}', 'on': dt.date.today().isoformat(),
            'from': self.pdf_path.name, 'pages': len(self.doc), 'figures': len(self.figures), 'tables': len(self.tables),
            'tables_as_images': sum(1 for t in self.tables.values() if 'image' in t), 'equations': len(self.equations),
            'references': len(self.refs), 'reference_style': self.ref_style, 'coverage': self.coverage(body),
            'check': [f'p{b.page + 1} {b.kind}: {b.text[:90]}' for b in self.boxes
                      if (b.kind in ('drop', 'in-figure', 'in-table') and len(b.text) > 300 and b.cls not in ('page-header', 'page-footer')
                          and not re.match(r'^(?:\*\*)?(open access|this article is|disclaimer|publisher|springer nature)', b.text, re.I))
                      or (b in self.front and b.page > min(self.pages) + 1 and len(b.text) > 200)][:12],
        }
        (out / 'paper.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        return meta

    def affiliations(self):
        """Best effort: numbered affiliations from the first page."""
        out = {}
        first = min(self.pages)
        for bx in self.front + [b for b in self.boxes if b.kind == 'side' or b.cls == 'footnote']:
            if bx.page != first or not AFFIL_RE.search(bx.text) or len(bx.text) > 900:
                continue
            for part in re.split(r'(?=<sup>\s*[\da-z]{1,2}\s*</sup>)|\n(?=\d{1,2}\s?[A-Z])', bx.md):
                m = re.match(r'^\s*(?:<sup>\s*([\da-z]{1,2})\s*</sup>|(\d{1,2}))\s*(.+)$', part.strip(), re.S)
                if m:
                    key = m.group(1) or m.group(2)
                    val = re.sub(r'\s+', ' ', plain(m.group(3))).strip(' ,;')
                    if AFFIL_RE.search(val) and 10 < len(val) < 300 and key not in out:
                        out[key] = val
        return out

    def coverage(self, body_md):
        """Share of the PDF's body words (outside figures, tables, equations) found in paper.md."""
        src = collections.Counter()
        for bx in self.body + self.tail + self.refs_boxes:
            if bx.kind in ('drop', 'in-figure', 'in-table', 'figure', 'table', 'equation', 'figure-anchor'):
                continue
            src.update(tokens(bx.text))
        got = collections.Counter(tokens(plain(TAG_RE.sub(' ', body_md))))
        total = sum(src.values())
        return round(sum((src & got).values()) / total, 4) if total else 1.0


def extract(pdf_path, pub, slug, force=False):
    out = ROOT / 'publications' / slug
    old = {}
    if (out / 'paper.json').exists():
        old = json.loads((out / 'paper.json').read_text(encoding='utf-8'))
        if old.get('reviewed') and not force:
            print(f'  skip {slug}: marked reviewed (use --force)')
            return old
    (out / 'figures').mkdir(parents=True, exist_ok=True)
    for f in (out / 'figures').glob('*.webp'):           # images from an earlier extraction
        if re.match(r'(fig|table|alg|eq)-', f.name):
            f.unlink()
    ex = Extractor(pdf_path, pub)
    ex.collect()
    ex.drop_furniture()
    ex.split()
    ex.regions(out)
    ex.flow()
    ex.references()
    meta = ex.write(out, slug, old)
    e = meta['extracted']
    print(f'  {slug}: {e["pages"]}p, {e["figures"]} fig, {e["tables"]} tab ({e["tables_as_images"]} img), {e["equations"]} eq, '
          f'{e["references"]} refs [{e["reference_style"]}], coverage {e["coverage"]:.3f}')
    return meta


def abstract_only(pub, slug, see_also='', force=False):
    """A page for a paper without a local PDF (or a conference version of a paper): metadata + abstract."""
    out = ROOT / 'publications' / slug
    old = json.loads((out / 'paper.json').read_text(encoding='utf-8')) if (out / 'paper.json').exists() else {}
    if old.get('reviewed') and not force:
        print(f'  skip {slug}: marked reviewed (use --force)')
        return old
    if old and not old.get('extracted', {}).get('abstract_only') and not see_also and not force:
        print(f'  ! {slug}: its PDF was not found - keeping the full-text page (check --pdf-dir, or use --force)')
        return old
    out.mkdir(parents=True, exist_ok=True)
    (out / 'paper.md').write_text('', encoding='utf-8')
    link = next((l['link'] for l in pub['fileLinks'] if l.get('type') == 1), '')
    names = [a.strip() for a in re.split(r',\s*', pub.get('authors', '')) if a.strip()]
    meta = {'title': pub['name'], 'pub_type': pub.get('type', 'Paper'), 'short_title': '', 'authors': [{'name': n, 'given': ' '.join(n.split()[:-1]), 'family': n.split()[-1]} for n in names],
            'affiliations': {}, 'journal': pub.get('publisher', ''), 'year': pub.get('year'), 'volume': '', 'issue': '', 'pages': '', 'doi': '',
            'published': '', 'abstract': re.sub(r'\s+', ' ', pub.get('description', '')).strip(), 'keywords': [], 'license': {},
            'summary': '', 'key_findings': [], 'key_numbers': [], 'featured_figure': '', 'related_project': '',
            'pdf_url': link if link.startswith('http') else PDF_URL_BASE + link, 'slug': slug, 'lang': 'en', 'reviewed': False,
            'see_also': see_also, 'extracted': {'on': dt.date.today().isoformat(), 'abstract_only': True}}
    for k in KEEP_FIELDS:
        if old.get(k):
            meta[k] = old[k]
    (out / 'paper.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'  {slug}: abstract-only page')
    return meta


def pub_key(title, year, kind):
    return f'{norm(title)}|{year}|{(kind or "").lower()}'


def assign_slugs(pubs):
    """Stable folder names: reuse the folder that already has this paper, otherwise make one from the title."""
    existing = {}
    for f in (ROOT / 'publications').glob('*/paper.json'):
        try:
            m = json.loads(f.read_text(encoding='utf-8'))
            existing[pub_key(m['title'], m.get('year'), m.get('pub_type', 'paper'))] = f.parent.name
        except Exception:
            pass
    used, out = set(existing.values()), {}
    for p in pubs:
        key = pub_key(p['name'], p.get('year'), p.get('type'))
        if key in existing:
            out[key] = existing[key]
            continue
        s = slugify(p['name'])
        if s in used:
            s = f'{s}-{p.get("year", "")}'.strip('-')
        base, i = s, 2
        while s in used:
            s, i = f'{base}-{i}', i + 1
        used.add(s)
        out[key] = s
    return out


def slug_of(slugs, p):
    return slugs[pub_key(p['name'], p.get('year'), p.get('type'))]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('target', help='"all", or a PDF file name/path')
    ap.add_argument('--slug')
    ap.add_argument('--pdf-dir', default=str(DEFAULT_PDF_DIR))
    ap.add_argument('--force', action='store_true', help='re-extract papers marked reviewed')
    ap.add_argument('--only-new', action='store_true', help='skip papers that already have a folder')
    ap.add_argument('--start', type=int, default=0, help='with "all": first entry to process')
    ap.add_argument('--count', type=int, default=10 ** 6, help='with "all": how many entries')
    a = ap.parse_args()
    pubs = json.loads(PUBS.read_text(encoding='utf-8-sig'))['publications']
    slugs = assign_slugs(pubs)
    pdf_dir = Path(a.pdf_dir)
    by_pdf = collections.defaultdict(list)
    for p in pubs:
        by_pdf[next((l['link'] for l in p.get('fileLinks', []) if l.get('type') == 1), '')].append(p)
    if a.target != 'all':
        name = Path(a.target).name
        p = next((p for p in pubs for l in p.get('fileLinks', []) if l.get('type') == 1 and l.get('link', '').endswith('/' + name)), None)
        if not p:
            sys.exit(f'{name}: no entry in {PUBS.name} links to this PDF')
        path = Path(a.target) if Path(a.target).exists() else pdf_dir / name
        extract(path, p, a.slug or slug_of(slugs, p), a.force)
        return
    papers_by_title = {norm(p['name']): p for p in pubs if p.get('type') == 'Paper'}
    for p in pubs[a.start:a.start + a.count]:
        slug = slug_of(slugs, p)
        if a.only_new and (ROOT / 'publications' / slug / 'paper.json').exists():
            continue
        link = next((l['link'] for l in p.get('fileLinks', []) if l.get('type') == 1), '')
        name = link.rsplit('/', 1)[-1]
        twins = by_pdf.get(link, [p])
        main_twin = next((t for t in twins if t.get('type') == 'Paper'), twins[0])
        try:
            if not link.startswith('/files/') or not (pdf_dir / name).exists():
                abstract_only(p, slug, force=a.force)
            elif main_twin is not p:
                abstract_only(p, slug, see_also=f'publications/{slug_of(slugs, main_twin)}/')
            elif p.get('type') != 'Paper' and norm(p['name']) in papers_by_title:
                abstract_only(p, slug, see_also=f'publications/{slug_of(slugs, papers_by_title[norm(p["name"])])}/')
            else:
                extract(pdf_dir / name, p, slug, a.force)
        except Exception as e:
            import traceback
            print(f'  ! {slug}: {type(e).__name__}: {e}')
            traceback.print_exc()


if __name__ == '__main__':
    main()
