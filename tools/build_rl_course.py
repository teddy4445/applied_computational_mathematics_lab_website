#!/usr/bin/env python3
"""Build the reinforcement-learning course pages: rl-course/index.html and rl-course/lecture-NN/index.html.

Data:      data/rl-course.json              lectures, episodes (YouTube ids, chapters), labs and games
           data/rl-course-transcripts.json  episode transcripts by chapter (from each episode's captions)
Templates: tools/templates/rl-course.html             page frame (head, menu, footer)
           tools/templates/rl-course-lab-*.html       one per lab (see LAB_TEMPLATES)
Files the pages use (not made here): rl-course/slides/*.pdf, rl-course/img/{slides,episodes,games}/*.webp,
rl-course/img/teddy-bit-chess.svg (+ .png for the share image), css/rl-course.css (+ css/project.css, css/videos.css),
js/rl-course.js (+ js/videos.js), and for the labs css/exploration-lab.css, css/rl-labs.css, js/exploration-lab.js
(bandit and gridworld labs) and js/rl-labs.js (the other labs).

It also writes a share image (share.jpg) for each page and the course pages in sitemap.xml and llms.txt.
Standard library + Pillow (for the share images). Run after changing the data or a template:

    python tools/build_rl_course.py
"""
import datetime as dt
import html
import json
import re
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://acml.teddylazebnik.com'
DATA = ROOT / 'data' / 'rl-course.json'
TPL = ROOT / 'tools' / 'templates'
OUT = ROOT / 'rl-course'
MARK_START, MARK_END = 'rl course pages: start (made by tools/build_rl_course.py)', 'rl course pages: end'
TRANSCRIPTS = ROOT / 'data' / 'rl-course-transcripts.json'
HUB_ART = 'rl-course/img/teddy-bit-chess.svg'
LAB_TEMPLATES = {
    'bandit-lab': 'rl-course-lab-bandit.html', 'dp-lab': 'rl-course-lab-dp.html', 'contraction-lab': 'rl-course-lab-contraction.html',
    'td-mc-lab': 'rl-course-lab-td-mc.html', 'gridworld-lab': 'rl-course-lab-gridworld.html', 'mountain-car-lab': 'rl-course-lab-mountain-car.html',
    'mcts-lab': 'rl-course-lab-mcts.html', 'pg-bandit-lab': 'rl-course-lab-pg-bandit.html', 'bt-lab': 'rl-course-lab-bt.html',
}
OLD_LABS = {'bandit-lab', 'gridworld-lab'}  # these two run on js/exploration-lab.js; the others on js/rl-labs.js


def esc(s):
    return html.escape(str(s), quote=True)


def mins(seconds):
    return max(1, round(seconds / 60))


def yt_watch(vid, playlist=None):
    return f'https://www.youtube.com/watch?v={vid}' + (f'&list={playlist}' if playlist else '')


def plural(n, word, many=None):
    return f'{n} {word if n == 1 else (many or word + "s")}'


def and_list(items):
    return items[0] if len(items) == 1 else ', '.join(items[:-1]) + ' and ' + items[-1]


def replace_block(text, start_line, end_line, new_lines):
    if start_line not in text:
        return None
    a = text.rfind('\n', 0, text.index(start_line)) + 1
    b = text.find('\n', text.index(end_line, a)) + 1
    return text[:a] + new_lines + text[b:]


# ---------------------------------------------------------------- pieces
def stat(value, label, long=False):
    return f'<div class="proj-stat"><strong{" class=is-long" if long else ""}>{esc(value)}</strong><span>{esc(label)}</span></div>'


def btn(href, icon, label, primary=False, external=False, extra=''):
    ext = ' target="_blank" rel="noopener"' if external else ''
    return f'<a class="proj-btn{" proj-btn-primary" if primary else ""}" href="{esc(href)}"{ext}{extra}><i class="{icon}" aria-hidden="true"></i>{esc(label)}</a>'


def crumbs(*items):
    parts = []
    for label, href in items:
        parts.append(f'<a href="{esc(href)}">{esc(label)}</a>' if href else f'<span>{esc(label)}</span>')
    return '<nav class="proj-crumbs" aria-label="Breadcrumb">' + '<i class="ri-arrow-right-s-line" aria-hidden="true"></i>'.join(parts) + '</nav>'


def subnav(items, mobile_only=False):
    return (f'    <nav class="proj-subnav{" is-mobile-only" if mobile_only else ""}" aria-label="Sections of this page"><div class="proj-wrap"><ul>' +
            ''.join(f'<li><a href="#{a}">{esc(b)}</a></li>' for a, b in items) + '</ul></div></nav>')


def section(sid, inner, soft=False, extra_cls=''):
    return (f'    <section id="{sid}" class="proj-section{" is-soft" if soft else ""}{(" " + extra_cls) if extra_cls else ""}" aria-labelledby="{sid}-title"><div class="proj-wrap">\n'
            f'{inner}\n    </div></section>')


def game_card(g, lectures, why=None):
    chips = ''.join(f'<a class="rl-chip is-plain" href="/rl-course/{lectures[n - 1]["slug"]}/">Lecture {n}</a>' for n in g['lectures'])
    learn = ''.join(f'<span class="rl-chip is-game">{esc(x)}</span>' for x in g['learn'])
    body = (f'<p class="rl-game-title">{esc(g["title"])}</p><p class="rl-game-tag">{esc(g["tagline"])}</p>'
            + (f'<p class="rl-game-why"><b>In this lecture:</b> {esc(why)}</p><p class="rl-game-text">{esc(g["text"])}</p>' if why else
               f'<p class="rl-game-text">{esc(g["text"])}</p><div class="rl-chips">{learn}</div>'))
    foot = (f'<div class="rl-game-foot">{btn(g["url"], "ri-gamepad-line", "Play", True, True)}'
            + ('' if why else f'<div class="rl-chips" aria-label="Lectures it goes with">{chips}</div>') + '</div>')
    return (f'<article class="rl-game"><a href="{esc(g["url"])}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">'
            f'<img src="/{esc(g["img"])}" alt="" width="800" height="450" loading="lazy" decoding="async"></a>'
            f'<div class="rl-game-body">{body}{foot}</div></article>')


def lab_card(lab, lectures):
    lec = lectures[lab['lecture'] - 1]
    return (f'<a class="tool-card rl-lab-card" href="/rl-course/{lec["slug"]}/#{lab["id"]}"><div class="card-body">'
            f'<span class="tool-icon"><i class="{lab["icon"]}" aria-hidden="true"></i></span>'
            f'<p class="card-title">{esc(lab["title"])}</p><p class="card-text">{esc(lab["text"])}</p>'
            f'<span class="card-more">Open it in Lecture {lab["lecture"]} <i class="ri-arrow-right-line" aria-hidden="true"></i></span></div></a>')


# ---------------------------------------------------------------- share images
def share_image(src_imgs, dst, title, kicker):
    """1200x630 JPEG: a dark-blue card with the title and a picture (a slide, or the hub drawing on a white card)."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return dst.exists()
    newest = max(p.stat().st_mtime for p in src_imgs)
    if dst.exists() and dst.stat().st_mtime >= max(newest, DATA.stat().st_mtime, Path(__file__).stat().st_mtime):
        return True
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), (13, 27, 62))
    d = ImageDraw.Draw(im)
    for y in range(H):  # soft vertical gradient
        c = (13 + y * 10 // H, 27 + y * 20 // H, 62 + y * 50 // H)
        d.line([(0, y), (W, y)], fill=c)

    def font(size, bold=True):
        names = (['arialbd.ttf', 'DejaVuSans-Bold.ttf', 'Arial Bold.ttf', 'LiberationSans-Bold.ttf'] if bold else
                 ['arial.ttf', 'DejaVuSans.ttf', 'Arial.ttf', 'LiberationSans-Regular.ttf'])
        for n in names:
            for base in ['', 'C:/Windows/Fonts/', '/usr/share/fonts/truetype/dejavu/', '/usr/share/fonts/truetype/liberation/', '/Library/Fonts/']:
                try:
                    return ImageFont.truetype(base + n, size)
                except OSError:
                    pass
        return ImageFont.load_default()

    shot = Image.open(src_imgs[0])
    drawing = shot.mode == 'RGBA'  # keep a drawing below the kicker line
    k = min(560 / shot.width, (330 if drawing else 410) / shot.height)
    w, h = round(shot.width * k), round(shot.height * k)
    x0, y0 = 600 + (560 - w) // 2, (340 if drawing else 315) - h // 2
    shot = shot.resize((w, h), Image.LANCZOS)
    if drawing:  # a transparent background: put it on a white card
        d.rounded_rectangle([x0 - 10, y0 - 10, x0 + w + 10, y0 + h + 10], radius=26, fill=(255, 255, 255))
        im.paste(shot, (x0, y0), shot)
    else:
        im.paste(shot.convert('RGB'), (x0, y0))
        d.rectangle([x0, y0, x0 + w - 1, y0 + h - 1], outline=(96, 165, 250), width=3)
    d.text((60, 120), kicker.upper(), font=font(26), fill=(96, 165, 250))
    words, lines, line = title.split(), [], ''
    f = font(54)
    for w in words:
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=f) > 500 and line:
            lines.append(line)
            line = w
        else:
            line = t
    lines.append(line)
    y = 170
    for ln in lines[:4]:
        d.text((60, y), ln, font=f, fill=(255, 255, 255))
        y += 66
    d.text((60, 540), 'ACML · Teddy Lazebnik · acml.teddylazebnik.com/rl-course', font=font(24, False), fill=(191, 219, 254))
    im.save(dst, 'JPEG', quality=86, optimize=True)
    return True


# ---------------------------------------------------------------- pages
def page(template, *, url, title, og_title, description, keywords, share, jsonld, body, labs=()):
    ld = json.dumps(jsonld, ensure_ascii=False, indent=2).replace('\n', '\n      ')
    old, new = any(x in OLD_LABS for x in labs), any(x not in OLD_LABS for x in labs)
    css = (['<link href="/css/exploration-lab.css" rel="stylesheet">'] if labs else []) + (['<link href="/css/rl-labs.css" rel="stylesheet">'] if new else [])
    js = (['<script src="/js/exploration-lab.js"></script>'] if old else []) + (['<script src="/js/rl-labs.js"></script>'] if new else [])
    return Template(template).substitute(
        page_title=esc(title), og_title=esc(og_title), description=esc(description), keywords=esc(keywords), url=esc(url),
        share_url=esc(share), jsonld='      ' + ld, body=body, lab_css='\n      '.join(css), lab_js='\n      '.join(js))


def build_hub(data, template, eps):
    L = data['lectures']
    total_pages = sum(l['slides']['pages'] for l in L)
    total_min = mins(sum(e['seconds'] for e in data['episodes']))
    hero = f'''    <header class="proj-hero rl-hero">
      <div class="proj-wrap proj-hero-grid">
        <div>
          {crumbs(("Home", "/"), ("Tools", "/tools.html"), ("Reinforcement learning course", None))}
          <p class="proj-kicker"><span><i class="ri-graduation-cap-line" aria-hidden="true"></i>Open course materials</span><span><i class="ri-user-3-line" aria-hidden="true"></i>{esc(data["teacher"])}</span></p>
          <h1 class="proj-title">{esc(data["title"])}</h1>
          <p class="proj-subtitle">{esc(data["description"])}</p>
          <div class="proj-stats">{stat(len(L), "lectures")}{stat(len(data["episodes"]), "short episodes, about " + str(round(total_min / 60, 1)).rstrip("0").rstrip(".") + " hours")}{stat(total_pages, "slides")}{stat(f"{len(data['labs'])} + {len(data['games'])}", "labs and games", True)}</div>
          <div class="proj-actions">{btn("/rl-course/lecture-01/", "ri-play-circle-line", "Start with Lecture 1", True)}{btn("#lectures", "ri-list-check-2", "All lectures")}{btn("#practice", "ri-gamepad-line", "Labs and games")}{btn("https://www.youtube.com/playlist?list=" + data["playlist"], "ri-youtube-line", "Playlist on YouTube", external=True)}</div>
        </div>
        <figure class="rl-art"><img src="/{HUB_ART}" alt="Illustration: Teddy and Bit, the course’s little robot, playing chess" width="640" height="470" fetchpriority="high" decoding="async"></figure>
      </div>
    </header>'''
    nav = subnav([('how', 'How to study'), ('lectures', 'Lectures'), ('practice', 'Labs and games')])

    how = f'''      <h2 id="how-title" class="proj-h2">How to study each lecture</h2>
      <p class="proj-lead">Every lecture page brings the same four things together. Use them in any order; this one works well.</p>
      <div class="rl-steps is-4">
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-play-circle-line" aria-hidden="true"></i></span><h3>Watch</h3><p>Start with the lecture's short animated episodes (ACML Explains), about five minutes each, with a transcript to read along. They give the intuition first.</p></div>
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-slideshow-line" aria-hidden="true"></i></span><h3>Read the slides</h3><p>Each deck is written to be read without a lecturer: worked examples, “try it” boxes, small simulations, and check-yourself questions with answers at the end.</p></div>
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-flask-line" aria-hidden="true"></i></span><h3>Try it</h3><p>Run the algorithms yourself in the browser: {len(data["labs"])} labs, from a <a href="/rl-course/lecture-02/#bandit-lab">bandit lab</a> in Lecture 2 to a <a href="/rl-course/lecture-12/#bt-lab">Bradley–Terry lab</a> in Lecture 12.</p></div>
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-gamepad-line" aria-hidden="true"></i></span><h3>Play</h3><p>Three games turn the ideas into play: Markov’s Maze, Echo Heist and Pirates War RL. Each lecture page says which one fits and what to look for.</p></div>
      </div>'''

    parts = []
    for pi, part in enumerate(data['parts'], 1):
        cards = []
        for n in part['lectures']:
            l = L[n - 1]
            le = [eps[e] for e in l['episodes']]
            badges = ''
            if l['labs']:
                badges += '<span><i class="ri-flask-line" aria-hidden="true"></i>Lab</span>'
            if l['games']:
                badges += f'<span><i class="ri-gamepad-line" aria-hidden="true"></i>{plural(len(l["games"]), "game")}</span>'
            cards.append(f'''<a class="rl-lec-card" href="/rl-course/{l["slug"]}/"><img src="/{esc(l["slides"]["cover"])}" alt="A slide from Lecture {n}" width="960" height="540" loading="lazy" decoding="async"><div class="rl-lec-body">
            <span class="rl-lec-num">Lecture {n}</span><span class="rl-lec-title">{esc(l["title"])}</span><span class="rl-lec-text">{esc(l["topics"])}</span>
            <span class="rl-lec-meta"><span><i class="ri-slideshow-line" aria-hidden="true"></i>{l["slides"]["pages"]} slides</span><span><i class="ri-play-circle-line" aria-hidden="true"></i>{plural(len(le), "episode")} · {mins(sum(e["seconds"] for e in le))} min</span>{badges}</span></div></a>''')
        parts.append(f'''      <div class="rl-part">
        <div class="rl-part-head"><h3><span>Part {pi}</span>{esc(part["title"])}</h3><p>{esc(part["text"])}</p></div>
        <div class="rl-lec-grid is-{len(cards)}">
          {"".join(cards)}
        </div>
      </div>''')
    lectures = f'''      <h2 id="lectures-title" class="proj-h2">Twelve lectures</h2>
      <p class="proj-lead">From an agent chasing a single number to learning from people. Each card opens the lecture page with its episodes, slides, lab and games.</p>
      <div style="margin-top:1.75rem">
{chr(10).join(parts)}
      </div>
      <p class="rl-note">The order of topics follows the DeepMind × UCL Reinforcement Learning Lecture Series (2021) and, for parts of Lectures 9 and 12, Stanford CS234 (2024). The slides, figures, examples and simulations are ACML’s own, not official DeepMind, UCL or Stanford material; each lecture page names its source.</p>'''

    practice = f'''      <h2 id="practice-title" class="proj-h2">Labs and games</h2>
      <p class="proj-lead">Learn by doing. The labs run the algorithms from the lectures in your browser; the games put you, or an agent you build, inside a reinforcement-learning problem.</p>
      <h3 class="proj-h3" style="margin-top:2rem">Interactive labs</h3>
      <div class="proj-grid">{"".join(lab_card(x, L) for x in data["labs"])}</div>
      <h3 class="proj-h3" style="margin-top:2.5rem">Games</h3>
      <div class="rl-games">{"".join(game_card(g, L) for g in data["games"])}</div>'''

    body = '\n'.join([hero, nav, section('how', how), section('lectures', lectures, soft=True), section('practice', practice)])
    url = f'{SITE}/rl-course/'
    jsonld = {
        '@context': 'https://schema.org', '@type': 'Course', 'name': data['title'], 'description': data['description'], 'url': url,
        'inLanguage': 'en', 'isAccessibleForFree': True,
        'provider': {'@type': 'Organization', 'name': 'Applied Computational Mathematics Laboratory', 'url': f'{SITE}/'},
        'instructor': {'@type': 'Person', 'name': 'Teddy Lazebnik', 'url': 'https://teddylazebnik.com/'},
        'hasPart': [{'@type': 'LearningResource', 'name': f'Lecture {l["num"]}: {l["title"]}', 'url': f'{SITE}/rl-course/{l["slug"]}/'} for l in L],
    }
    art_png = ROOT / HUB_ART.replace('.svg', '.png')
    share_ok = share_image([art_png if art_png.exists() else ROOT / L[2]['slides']['cover']], OUT / 'share.jpg', data['title'],
                           f'{len(L)} lectures · {len(data["episodes"])} episodes · labs and games')
    return page(template, url=url, title=f'{data["title"]} | Course | Applied Computational Mathematics Laboratory',
                og_title=f'{data["title"]}: a free online course by ACML',
                description=f'{len(L)} lectures with slides, {len(data["episodes"])} short animated episodes, interactive labs and games: an introduction to reinforcement learning by Teddy Lazebnik (ACML).',
                keywords='reinforcement learning course, RL lectures, multi-armed bandit, Markov decision process, Q-learning, deep reinforcement learning, policy gradient, RLHF, ACML',
                share=f'{SITE}/rl-course/share.jpg' if share_ok else f'{SITE}/img/logo.png', jsonld=jsonld, body=body)


def transcript_html(e, tx, hidden):
    chapters = tx.get(str(e['ep']))
    if not chapters:
        return ''
    secs = ''.join(f'<div class="rl-tx-chap"><button type="button" class="rl-tx-t" data-s="{c["s"]}" aria-label="Play from {esc(c["t"])}">{esc(c["t"])}</button>'
                   f'<div><h4>{esc(c["title"])}</h4><p>{esc(c["text"])}</p></div></div>' for c in chapters)
    return f'<div class="rl-tx-ep" data-ep="{e["ep"]}"{" hidden" if hidden else ""}>{secs}</div>'


def build_lecture(data, template, eps, l, tx):
    L = data['lectures']
    n = l['num']
    le = [eps[e] for e in l['episodes']]
    games = {g['id']: g for g in data['games']}
    labs = {x['id']: x for x in data['labs']}
    part = next(p for p in data['parts'] if n in p['lectures'])
    pi = data['parts'].index(part) + 1
    s = l['slides']
    pdf = '/' + s['pdf']
    vid_min = mins(sum(e['seconds'] for e in le))
    first = le[0]
    ideas = ''.join(f'<li><a href="#ep-{e["ep"]}">Ep. {e["ep"]}</a><span>{esc(e["takeaway"])}</span></li>' for e in le)
    hero = f'''    <header class="proj-hero rl-hero">
      <div class="proj-wrap proj-hero-grid">
        <div>
          {crumbs(("Home", "/"), ("Tools", "/tools.html"), ("RL course", "/rl-course/"), (f"Lecture {n}", None))}
          <p class="proj-kicker"><span><i class="ri-graduation-cap-line" aria-hidden="true"></i>{esc(data["title"])}</span><span>Part {pi} · {esc(part["title"])}</span></p>
          <h1 class="proj-title"><small>Lecture {n}</small>{esc(l["title"])}</h1>
          <p class="proj-about-lead rl-summary">{esc(l["summary"])}</p>
          <div class="rl-goal"><i class="ri-focus-3-line" aria-hidden="true"></i><span>By the end you should be able to {esc(l["goal"])}</span></div>
          <h2 class="proj-h3 rl-ideas-title">Key ideas, one per episode</h2>
          <ul class="rl-ideas">{ideas}</ul>
          <p class="rl-source"><b>Based on:</b> {esc(l["source"])}. The slides follow that order of topics, in our own words, figures and examples; they are not official material of the original course.</p>
        </div>
        <div class="rl-first">
          <a class="rl-first-img" href="{esc(pdf)}" target="_blank" rel="noopener"><img src="/{esc(s["first"])}" alt="The title slide of Lecture {n}: {esc(l["title"])}" width="960" height="540" fetchpriority="high" decoding="async"></a>
          <p class="rl-first-text">{s["pages"]} slides, written to be read on your own, with worked examples, “try it” boxes, small simulations and check-yourself questions (answers at the end). PDF, {s["mb"]} MB.</p>
          <div class="proj-actions">{btn(pdf, "ri-external-link-line", "Open the PDF", True, True)}{btn(pdf, "ri-download-2-line", "Download", extra=" download")}</div>
        </div>
      </div>
    </header>'''
    menu = [('watch', 'Watch')]
    if l['labs']:
        menu.append(('lab', 'Lab'))
    if l['games']:
        menu.append(('play', 'Play'))
    menu.append(('next', 'Next'))
    nav = subnav(menu, mobile_only=True)  # on wider screens the page is short enough without it

    ep_items = ''.join(
        f'<li id="ep-{e["ep"]}"><a class="rl-ep{" is-active" if i == 0 else ""}" data-ep="{e["ep"]}" href="{esc(yt_watch(e["youtube"], data["playlist"]))}"{" aria-current=true" if i == 0 else ""}>'
        f'<span class="rl-ep-thumb"><img src="/{esc(e["thumb"])}" alt="" width="640" height="360" loading="lazy" decoding="async"><span>{esc(e["duration"])}</span></span>'
        f'<span><span class="rl-ep-num">Episode {e["ep"]}</span><span class="rl-ep-title" style="display:block">{esc(e["title"])}</span><span class="rl-ep-take" style="display:block">{esc(e["takeaway"])}</span></span></a></li>'
        for i, e in enumerate(le))
    txs = ''.join(transcript_html(e, tx, i > 0) for i, e in enumerate(le))
    transcript = (f'''
            <details id="rl-tx" class="rl-tx">
              <summary><i class="ri-file-text-line" aria-hidden="true"></i>Transcript<span id="rl-tx-which">Episode {first["ep"]}</span><i class="ri-arrow-down-s-line rl-tx-caret" aria-hidden="true"></i></summary>
              <div class="rl-tx-body">{txs}</div>
            </details>''' if txs else '')
    ep_json = json.dumps([{'ep': e['ep'], 'youtube': e['youtube'], 'title': e['title'], 'duration': e['duration'], 'hook': e['hook'],
                           'takeaway': e['takeaway'], 'thumbAbs': '/' + e['thumb']} for e in le], ensure_ascii=False).replace('</', '<\\/')
    watch = f'''      <h2 id="watch-title" class="proj-h2">Watch</h2>
      <p class="proj-lead">{plural(len(le), "short episode")} of ACML Explains for this lecture. Pick one from the list, and open the transcript to read along: each timestamp plays the episode from there. The narration is generated with a voice clone of Teddy, used with his permission.</p>
      <div class="rl-watch">
        <div class="rl-player-wrap">
          <div id="rl-player" class="yt-player yt-16x9" data-yt-id="{esc(first["youtube"])}" data-yt-title="{esc(first["title"])}"><a class="yt-play" href="{esc(yt_watch(first["youtube"], data["playlist"]))}" aria-label="Play episode {first["ep"]}: {esc(first["title"])}"><img src="/{esc(first["thumb"])}" alt="" width="640" height="360" decoding="async"><span class="yt-play-icon" aria-hidden="true"><i class="ri-play-fill"></i></span></a></div>
          <div class="rl-now">
            <p id="rl-now-num" class="rl-now-num">Episode {first["ep"]} · {esc(first["duration"])}</p>
            <p id="rl-now-title" class="rl-now-title">{esc(first["title"])}</p>
            <p id="rl-now-hook" class="rl-now-hook">{esc(first["hook"])}</p>
            <p id="rl-now-take" class="rl-now-take"><i class="ri-lightbulb-flash-line" aria-hidden="true"></i><span>{esc(first["takeaway"])}</span></p>
          </div>{transcript}
        </div>
        <div class="rl-eps">
          <div class="rl-eps-head"><b>Lecture {n} episodes</b><span>{plural(len(le), "episode")} · {vid_min} min</span></div>
          <ol>{ep_items}</ol>
        </div>
      </div>
      <script type="application/json" id="rl-episodes">{ep_json}</script>'''

    lab_html = ''
    for i, lab_id in enumerate(l['labs']):
        lab = labs[lab_id]
        lab_tpl = (TPL / LAB_TEMPLATES[lab_id]).read_text(encoding='utf-8')
        lab_tpl = re.sub(r'^<!--.*?-->\n', '', lab_tpl, flags=re.S)
        sid = 'lab' if i == 0 else f'lab-{i + 1}'
        lab_html += f'''    <section id="{sid}" class="rl-lab" aria-labelledby="{sid}-title">
      <div class="proj-wrap rl-lab-head">
        <p class="proj-label"><i class="{lab["icon"]}" aria-hidden="true"></i>Interactive lab</p>
        <h2 id="{sid}-title" class="proj-h2" style="margin-top:.5rem">{esc(lab["title"])}</h2>
        <p class="proj-lead">{esc(lab["text"])}</p>
        <p class="proj-lead" style="margin-top:.6rem">{esc(lab.get("intro", ""))}</p>
      </div>
{lab_tpl.rstrip()}
    </section>'''

    play = ''
    if l['games']:
        cards = ''.join(game_card(games[g['id']], L, g['why']) for g in l['games'])
        k = len(l['games'])
        play = section('play', f'''      <h2 id="play-title" class="proj-h2">Play</h2>
      <p class="proj-lead">{"A game that goes" if k == 1 else "Games that go"} with this lecture, and what to look for while you play.</p>
      <div class="rl-games{" is-1" if k == 1 else (" is-2" if k == 2 else "")}">{cards}</div>''', soft=True)

    pn = []
    if n > 1:
        p = L[n - 2]
        pn.append(f'<a href="/rl-course/{p["slug"]}/"><i class="ri-arrow-left-line" aria-hidden="true"></i><span><small>Previous · Lecture {n - 1}</small><strong>{esc(p["title"])}</strong></span></a>')
    else:
        pn.append('<a href="/rl-course/"><i class="ri-arrow-left-line" aria-hidden="true"></i><span><small>Course page</small><strong>All lectures, labs and games</strong></span></a>')
    if n < len(L):
        q = L[n]
        pn.append(f'<a class="is-next" href="/rl-course/{q["slug"]}/"><span><small>Next · Lecture {n + 1}</small><strong>{esc(q["title"])}</strong></span><i class="ri-arrow-right-line" aria-hidden="true"></i></a>')
    else:
        pn.append('<a class="is-next" href="/rl-course/"><span><small>That’s the course</small><strong>Back to the course page</strong></span><i class="ri-arrow-right-line" aria-hidden="true"></i></a>')
    nxt = f'''      <h2 id="next-title" class="proj-h2">Keep going</h2>
      <div class="rl-pn">{"".join(pn)}</div>'''

    blocks = [hero, nav, section('watch', watch, soft=True)]
    if lab_html:
        blocks.append(lab_html)
    if play:
        blocks.append(play)
    blocks.append(section('next', nxt, soft=not play and not lab_html))
    body = '\n'.join(blocks)

    url = f'{SITE}/rl-course/{l["slug"]}/'
    jsonld = {
        '@context': 'https://schema.org', '@type': 'LearningResource', 'name': f'Lecture {n}: {l["title"]}', 'description': l['summary'], 'url': url,
        'inLanguage': 'en', 'isAccessibleForFree': True, 'learningResourceType': ['Lecture slides', 'Video'], 'teaches': l['topics'],
        'isPartOf': {'@type': 'Course', 'name': data['title'], 'url': f'{SITE}/rl-course/'},
        'author': {'@type': 'Person', 'name': 'Teddy Lazebnik', 'url': 'https://teddylazebnik.com/'},
        'publisher': {'@type': 'Organization', 'name': 'Applied Computational Mathematics Laboratory', 'url': f'{SITE}/'},
        'hasPart': [{'@type': 'VideoObject', 'name': e['title'], 'description': e['hook'], 'thumbnailUrl': f'{SITE}/{e["thumb"]}',
                     'embedUrl': f'https://www.youtube-nocookie.com/embed/{e["youtube"]}', 'duration': f'PT{e["seconds"] // 60}M{e["seconds"] % 60}S'} for e in le]
        + [{'@type': 'DigitalDocument', 'name': f'Lecture {n} slides', 'encodingFormat': 'application/pdf', 'url': f'{SITE}{pdf}'}],
    }
    (OUT / l['slug']).mkdir(parents=True, exist_ok=True)
    share_ok = share_image([ROOT / s['cover']], OUT / l['slug'] / 'share.jpg', f'Lecture {n}: {l["title"]}', 'Introduction to reinforcement learning')
    return page(template, url=url, title=f'Lecture {n}: {l["title"]} | Reinforcement Learning Course | ACML',
                og_title=f'Lecture {n}: {l["title"]} · {data["title"]}',
                description=f'Lecture {n} of {len(L)} of ACML’s introduction to reinforcement learning. {l["topics"]}: ' + and_list(
                    ['slides', plural(len(le), 'short episode')] + (['an interactive lab'] if l['labs'] else []) + ((['a game'] if len(l['games']) == 1 else ['games']) if l['games'] else [])) + '.',
                keywords=f'reinforcement learning, {l["title"].lower()}, RL course, lecture slides, ACML Explains',
                share=f'{url}share.jpg' if share_ok else f'{SITE}/img/logo.png', jsonld=jsonld, body=body, labs=l['labs'])


# ---------------------------------------------------------------- sitemap.xml, llms.txt
def write_keep(path, text_new, bom, eol):
    if eol == '\r\n':
        text_new = text_new.replace('\r\n', '\n').replace('\n', '\r\n')
    path.write_bytes((b'\xef\xbb\xbf' if bom else b'') + text_new.encode('utf-8'))


def update_sitemap(built, today):
    path = ROOT / 'sitemap.xml'
    raw = path.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw.decode('utf-8-sig')
    eol = '\r\n' if '\r\n' in text else '\n'
    old = dict(re.findall(r'<loc>(.*?)</loc>\s*<lastmod>(.*?)</lastmod>', text))
    lines = [f'  <!-- {MARK_START} -->']
    for b in built:
        loc = f'{SITE}/{b["path"]}'
        lastmod = old.get(loc) if not b['changed'] and old.get(loc) else f'{today}T00:00:00.000Z'
        lines += ['  <url>', f'    <loc>{loc}</loc>', f'    <lastmod>{lastmod}</lastmod>', f'    <priority>{b["priority"]}</priority>']
        lines += [f'    <image:image><image:loc>{SITE}/{img}</image:loc></image:image>' for img in b['images']]
        lines.append('  </url>')
    lines.append(f'  <!-- {MARK_END} -->')
    block = '\n'.join(lines) + '\n'
    new = replace_block(text.replace('\r\n', '\n'), MARK_START, MARK_END, block)
    if new is None:
        t = text.replace('\r\n', '\n')
        anchor = t.find('  <!-- project pages: start')
        i = anchor if anchor != -1 else t.index('</urlset>')
        new = t[:i] + block + t[i:]
    write_keep(path, new, bom, eol)


def update_llms(data, eps):
    path = ROOT / 'llms.txt'
    if not path.exists():
        return
    raw = path.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    text = raw.decode('utf-8-sig')
    eol = '\r\n' if '\r\n' in text else '\n'
    L = data['lectures']
    lines = [f'<!-- {MARK_START} -->', '## Course: Introduction to Reinforcement Learning', '',
             f'An open introductory course in reinforcement learning by Teddy Lazebnik ({SITE}/rl-course/): {len(L)} lectures, each with a slide deck (PDF), '
             f'short animated episodes of ACML Explains season 1 ({len(data["episodes"])} in all, on YouTube, each with a transcript), {len(data["labs"])} interactive browser labs ('
             + '; '.join(f'{x["title"]}, Lecture {x["lecture"]}' for x in data['labs']) + ') and links to three RL games (Markov’s Maze, Echo Heist, Pirates War RL). '
             'The order of topics follows the DeepMind × UCL Reinforcement Learning Lecture Series (2021) and, for parts of Lectures 9 and 12, Stanford CS234 (2024); '
             'the slides, figures and simulations are ACML’s own.', '']
    for l in L:
        le = [eps[e] for e in l['episodes']]
        lines.append(f'- [Lecture {l["num"]}: {l["title"]}]({SITE}/rl-course/{l["slug"]}/): {l["topics"]}. '
                     f'Slides: {SITE}/{l["slides"]["pdf"]} ({l["slides"]["pages"]} pages). Episodes: ' + '; '.join(f'Ep. {e["ep"]} “{e["title"]}”' for e in le) + '.')
    lines += ['', f'<!-- {MARK_END} -->']
    block = '\n'.join(lines) + '\n'
    t = text.replace('\r\n', '\n')
    new = replace_block(t, MARK_START, MARK_END, block)
    if new is None:
        anchor = t.find('<!-- project pages: start')
        new = (t[:anchor] + block + '\n' + t[anchor:]) if anchor != -1 else t.rstrip() + '\n\n' + block
    write_keep(path, new, bom, eol)


def main():
    data = json.loads(DATA.read_text(encoding='utf-8-sig'))
    eps = {e['ep']: e for e in data['episodes']}
    template = (TPL / 'rl-course.html').read_text(encoding='utf-8')
    tx = json.loads(TRANSCRIPTS.read_text(encoding='utf-8-sig'))['episodes'] if TRANSCRIPTS.exists() else {}
    OUT.mkdir(exist_ok=True)
    built = []

    def write(rel, html_text, priority, images):
        path = ROOT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        old = path.read_text(encoding='utf-8') if path.exists() else None
        changed = old != html_text
        if changed:
            path.write_text(html_text, encoding='utf-8', newline='\n')
        built.append({'path': rel.replace('index.html', ''), 'changed': changed, 'priority': priority, 'images': images})

    write('rl-course/index.html', build_hub(data, template, eps), '0.90', [HUB_ART.replace('.svg', '.png'), 'rl-course/share.jpg'])
    for l in data['lectures']:
        write(f'rl-course/{l["slug"]}/index.html', build_lecture(data, template, eps, l, tx), '0.80',
              [l['slides']['first']])
    today = dt.date.today().isoformat()
    update_sitemap(built, today)
    update_llms(data, eps)
    print(f'{len(built)} course pages ({sum(1 for b in built if b["changed"])} changed); sitemap.xml and llms.txt updated.')


if __name__ == '__main__':
    main()
