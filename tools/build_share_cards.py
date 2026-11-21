#!/usr/bin/env python3
"""Link previews (tools/share_cards.py) for the site's hand-made pages: the home page, team, projects list,
publications, tools, videos, media, the tools and games, and the reinforcement-learning course.

For each page in PAGES it draws the card and points the page's og:image and twitter:image at it (adding the tags
when a page has none). The title and the line under it come from the page's own og:title / <title> and
description, so they stay in step with the page. Paper, project and watch pages get their cards from
build_papers.py, build_projects.py and build_watch_pages.py.

    python tools/build_share_cards.py          (add --force to redraw every card)
"""
import argparse
import html
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import share_cards  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://acml.teddylazebnik.com'
SUFFIX = re.compile(r'\s*[|·]\s*(Applied Computational Mathematics Laboratory|Introduction to Reinforcement Learning)\s*$')

# page, card file, kicker, picture kind, picture, title override
PAGES = [
    ('index.html', 'img/share/home.jpg', 'ACML · Research lab', 'page', None,
     'Advancing computational mathematics through real-world problem solving'),
    ('team.html', 'img/share/team.jpg', 'ACML · People', 'page', None, None),
    ('projects.html', 'img/share/projects.jpg', 'ACML · Research', 'page', None, None),
    ('publications.html', 'img/share/publications.jpg', 'ACML · Research', 'page', None, None),
    ('videos.html', 'img/share/videos.jpg', 'ACML · Videos', 'video', None, None),
    ('tools.html', 'img/share/tools.jpg', 'ACML · Tools', 'page', None, None),
    ('media.html', 'img/share/media.jpg', 'ACML · In the news', 'page', None, None),
    ('statistics-demo.html', 'img/share/statistics.jpg', 'ACML · In numbers', 'page', None, None),
    ('author-analyzer.html', 'img/share/author-analyzer.jpg', 'ACML · Free tool', 'page', None, None),
    ('authorship-deal-risk-checker.html', 'img/share/authorship-deal-risk-checker.jpg', 'ACML · Free tool', 'page', None, None),
    ('stats-guider.html', 'img/share/stats-guider.jpg', 'ACML · Free tool', 'page', None, None),
    ('mayor-outbreak.html', 'img/share/mayor-outbreak.jpg', 'ACML · Game', 'page', None, None),
    ('sock.html', 'img/share/socks.jpg', 'ACML · Paper explainer', 'figure', 'assets/infographic-share.jpg', None),
    ('rl-course/index.html', 'rl-course/share.jpg', 'Free online course · 12 lectures', 'figure', 'rl-course/img/teddy-bit-chess.png', None),
]
SLIDES = {1: 'l01-s05', 2: 'l02-s13', 3: 'l03-s10', 4: 'l04-s08', 5: 'l05-s17', 6: 'l06-s16', 7: 'l07-s09', 8: 'l08-s12',
          9: 'l09-s05', 10: 'l10-s09', 11: 'l11-s08', 12: 'l12-s09'}
for n, slide in SLIDES.items():
    PAGES.append((f'rl-course/lecture-{n:02d}/index.html', f'rl-course/lecture-{n:02d}/share.jpg',
                  f'Reinforcement learning course · Lecture {n} of 12', 'figure', f'rl-course/img/slides/{slide}.webp', None))


def meta(text, key):
    m = re.search(r'<meta[^>]+(?:property|name)="' + re.escape(key) + r'"[^>]*content="([^"]*)"', text) or \
        re.search(r'<meta[^>]+content="([^"]*)"[^>]*(?:property|name)="' + re.escape(key) + r'"', text)
    return html.unescape(m.group(1)) if m else ''


def set_image(text, url):
    """Point og:image and twitter:image at url; add them (with twitter:card) after the description if missing."""
    done = set()
    for key in ('og:image', 'twitter:image'):
        pat = re.compile(r'(<meta[^>]+(?:property|name)="' + re.escape(key) + r'"[^>]*content=")[^"]*(")')
        text, n = pat.subn(lambda m: m.group(1) + url + m.group(2), text, count=1)
        if n:
            done.add(key)
    if len(done) < 2:
        nl = '\r\n' if '\r\n' in text else '\n'
        anchor = re.search(r'[ \t]*<meta name="description"[^>]*>', text) or re.search(r'[ \t]*<title>[^<]*</title>', text)
        indent = re.match(r'[ \t]*', anchor.group(0)).group(0)
        title = meta(text, 'og:title') or html.unescape(re.search(r'<title>([^<]*)</title>', text).group(1))
        desc = meta(text, 'og:description') or meta(text, 'description')
        add = []
        if not meta(text, 'og:title'):
            add.append(f'<meta property="og:title" content="{html.escape(title)}">')
        if desc and not meta(text, 'og:description'):
            add.append(f'<meta property="og:description" content="{html.escape(desc)}">')
        if 'og:image' not in done:
            add.append(f'<meta property="og:image" content="{url}">')
        if not meta(text, 'twitter:card'):
            add.append('<meta name="twitter:card" content="summary_large_image">')
        if 'twitter:image' not in done:
            add.append(f'<meta name="twitter:image" content="{url}">')
        text = text[:anchor.end()] + ''.join(nl + indent + a for a in add) + text[anchor.end():]
    return text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()
    changed = []
    for page, card, kicker, kind, picture, title_override in PAGES:
        f = ROOT / page
        if not f.exists():
            print('missing page:', page)
            continue
        raw = f.read_bytes()
        bom = raw.startswith(b'\xef\xbb\xbf')
        text = raw[3:].decode('utf-8') if bom else raw.decode('utf-8')
        title = title_override or SUFFIX.sub('', meta(text, 'og:title') or re.search(r'<title>([^<]*)</title>', text).group(1)).strip()
        title = html.unescape(title)
        desc = meta(text, 'og:description') or meta(text, 'description')
        dst = ROOT / card
        if args.force or share_cards.stale(dst, ROOT / picture if picture else None):
            share_cards.make_card(dst, title, kicker, kind, ROOT / picture if picture else None,
                                  badge='Shorts and explainers' if kind == 'video' else None,
                                  subtitle=desc if not page.startswith('rl-course/lecture') else None)
            changed.append(card)
        new = set_image(text, f'{SITE}/{card}')
        if new != text:
            f.write_bytes((b'\xef\xbb\xbf' if bom else b'') + new.encode('utf-8'))
            changed.append(page)
    print(f'{len(PAGES)} pages; written: {", ".join(changed) or "nothing"}')


if __name__ == '__main__':
    main()
