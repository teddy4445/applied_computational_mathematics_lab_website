"""Build the Epidemic Modeling course pages from data/epi-course.json:
  /epidemic-modeling/              hub (all 13 modules; modules not built yet show as "in production")
  /epidemic-modeling/module-NN/    one page per finished module (slides, episodes with transcripts, labs, games)
Run: python tools/build_epi_course.py   (standard library + Pillow; reuses the helpers of tools/build_rl_course.py)"""
import json, sys, datetime, re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_rl_course import esc, mins, plural, and_list, stat, btn, crumbs, subnav, section, share_image, page, write_keep, replace_block  # noqa: E402
import build_rl_course as _brc  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://acml.teddylazebnik.com'
DATA = ROOT / 'data' / 'epi-course.json'
_brc.DATA = DATA   # share_image() compares against the data file's time
TPL = ROOT / 'tools' / 'templates' / 'epi-course.html'
OUT = ROOT / 'epidemic-modeling'
BASE = '/epidemic-modeling/'
TPLDIR = ROOT / 'tools' / 'templates'
LAB_TEMPLATES = {'behave': 'epi-lab-behave.html', 'family': 'epi-lab-family.html', 'space': 'epi-lab-space.html', 'strains': 'epi-lab-strains.html', 'agents': 'epi-lab-agents.html', 'nowcast': 'epi-lab-nowcast.html', 'calib': 'epi-lab-calib.html', 'streams': 'epi-lab-streams.html', 'policy': 'epi-lab-policy.html', 'sens': 'epi-lab-sens.html', 'stability': 'epi-lab-stability.html'}   # lab id -> markup; the script is js/epi-labs.js
LAB_CSS = ['<link href="/css/exploration-lab.css" rel="stylesheet">', '<link href="/css/rl-labs.css" rel="stylesheet">']


def with_labs(html_, has_labs):
    """page() from the RL builder only knows the RL lab scripts; add the epidemic lab styles and script here."""
    if not has_labs:
        return html_
    html_ = html_.replace('<link href="/css/tailwind.css" rel="stylesheet">', '\n      '.join(LAB_CSS) + '\n      <link href="/css/tailwind.css" rel="stylesheet">', 1)
    return html_.replace('<script src="/js/epi-course.js" defer></script>', '<script src="/js/epi-labs.js" defer></script>\n      <script src="/js/epi-course.js" defer></script>', 1)


def lab_sections(data, m):
    labs = {x['id']: x for x in data.get('labs', [])}
    out = ''
    for i, lab_id in enumerate(m['labs']):
        lab = labs[lab_id]
        tpl = re.sub(r'^<!--.*?-->\n', '', (TPLDIR / LAB_TEMPLATES[lab_id]).read_text(encoding='utf-8'), flags=re.S)
        sid = 'lab' if i == 0 else f'lab-{i + 1}'
        out += f'''    <section id="{sid}" class="rl-lab" aria-labelledby="{sid}-title">
      <div class="proj-wrap rl-lab-head">
        <p class="proj-label"><i class="{lab["icon"]}" aria-hidden="true"></i>Interactive lab</p>
        <h2 id="{sid}-title" class="proj-h2" style="margin-top:.5rem">{esc(lab["title"])}</h2>
        <p class="proj-lead">{esc(lab["text"])}</p>
        <p class="proj-lead" style="margin-top:.6rem">{esc(lab.get("intro", ""))}</p>
      </div>
{tpl.rstrip()}
    </section>'''
    return out


def yt(e, start=0):
    return f'https://www.youtube.com/watch?v={e["youtube"]}' + (f'&t={start}s' if start else '') if e['youtube'] else '#watch'


def fmt_t(s):
    s = int(s)
    return f'{s // 60}:{s % 60:02d}'


def game_card(g, why, label='In this module'):
    return (f'<article class="rl-game"><a href="{esc(g["url"])}" tabindex="-1" aria-hidden="true">'
            f'<img src="/{esc(g["img"])}" alt="" width="800" height="450" loading="lazy" decoding="async"></a>'
            f'<div class="rl-game-body"><p class="rl-game-title">{esc(g["title"])}</p><p class="rl-game-tag">{esc(g["tagline"])}</p>'
            f'<p class="rl-game-why"><b>{label}:</b> {esc(why)}</p><p class="rl-game-text">{esc(g["text"])}</p>'
            f'<div class="rl-game-foot">{btn(g["url"], "ri-gamepad-line", "Play", True)}</div></div></article>')


def transcript_html(e, hidden):
    parts = ''.join(f'<div class="rl-tx-ch"><a class="rl-tx-t" href="{esc(yt(e, int(c["s"])))}" data-ep="{e["ep"]}" data-t="{int(c["s"])}">{fmt_t(c["s"])}</a>'
                    f'<p><b>{esc(c["title"])}.</b> {esc(c["text"])}</p></div>' for c in e['transcript'])
    if e.get('pending'): parts = '<div class="rl-tx-ch"><p>This episode is still being made. Its transcript will appear here when it is finished.</p></div>'
    return f'<div class="rl-tx-ep" data-ep="{e["ep"]}"{" hidden" if hidden else ""}>{parts}</div>'


def ep_block(e, i, mod):
    return (f'<li id="ep-{e["ep"]}"><a class="rl-ep{" is-active" if i == 0 else ""}" data-ep="{e["ep"]}" href="{esc(yt(e))}"{" aria-current=true" if i == 0 else ""}>'
            f'<span class="rl-ep-thumb"><img src="/{esc(e["thumb"])}" alt="" width="640" height="360" loading="lazy" decoding="async"><span>{esc(e["duration"])}</span></span>'
            f'<span><span class="rl-ep-num">Episode {e["ep"]} · {mod}.{e["k"]}</span><span class="rl-ep-title" style="display:block">{esc(e["title"])}</span>'
            f'<span class="rl-ep-take" style="display:block">{esc(e["takeaway"])}</span></span></a></li>')


def build_module(data, tpl, eps, m):
    M = data['modules']; n = m['num']
    me = [eps[k] for k in m['episodes']]
    games = {g['id']: g for g in data['games']}
    part = next(p for p in data['parts'] if n in p['modules'])
    s = m['slides']
    first = me[0]
    ideas = ''.join(f'<li><a href="#ep-{e["ep"]}">Ep. {e["ep"]}</a><span>{esc(e["takeaway"])}</span></li>' for e in me)
    slides_html = ''
    if s:
        pdf = '/' + s['pdf']
        slides_html = f'''
        <div class="rl-first">
          <a class="rl-first-img" href="{esc(pdf)}" target="_blank" rel="noopener"><img src="/{esc(s["first"])}" alt="The title slide of Module {n}: {esc(m["title"])}" width="960" height="540" fetchpriority="high" decoding="async"></a>
          <p class="rl-first-text">{s["pages"]} slides, written to be read on your own, with worked examples, “try it” boxes, our own small simulations and check-yourself questions (answers at the end). PDF, {s["mb"]} MB.</p>
          <div class="proj-actions">{btn(pdf, "ri-external-link-line", "Open the PDF", True, True)}{btn(pdf, "ri-download-2-line", "Download", extra=" download")}</div>
        </div>'''
    else:
        slides_html = f'''
        <div class="rl-first"><a class="rl-first-img" href="#watch"><img src="/{esc(first["thumb"])}" alt="" width="960" height="540" decoding="async"></a>
          <p class="rl-first-text">This module is one short episode, with no slide deck.</p></div>'''
    hero = f'''    <header class="proj-hero rl-hero">
      <div class="proj-wrap proj-hero-grid">
        <div>
          {crumbs(("Home", "/"), ("Courses", "/courses.html"), ("Epidemic Modeling", BASE), (f"Module {n}", None))}
          <p class="proj-kicker"><span><i class="ri-graduation-cap-line" aria-hidden="true"></i>{esc(data["title"])}</span><span>{esc(part["title"])}</span></p>
          <h1 class="proj-title"><small>Module {n}</small>{esc(m["title"])}</h1>
          <p class="proj-about-lead rl-summary">{esc(m["summary"])}</p>
          <div class="rl-goal"><i class="ri-focus-3-line" aria-hidden="true"></i><span>By the end you should be able to {esc(m["goal"])}</span></div>
          <h2 class="proj-h3 rl-ideas-title">Key ideas, one per episode</h2>
          <ul class="rl-ideas">{ideas}</ul>
          <p class="rl-source"><b>Textbook:</b> Chapter {n} of <a href="{BOOK_URL}" target="_blank" rel="noopener">{esc(data["book"])}</a>. {"The episodes and slides follow" if s else "The episode follows"} the chapter’s topics in our own words, figures and simulations; nothing is copied from the book.</p>
        </div>{slides_html}
      </div>
    </header>'''
    menu = [('watch', 'Watch')] + ([('lab', 'Lab')] if m['labs'] else []) + ([('play', 'Play')] if m['games'] else []) + [('next', 'Next')]
    nav = subnav(menu, mobile_only=True)
    items = ''.join(ep_block(e, i, n) for i, e in enumerate(me))
    txs = ''.join(transcript_html(e, i > 0) for i, e in enumerate(me))
    transcript = f'''
            <details id="rl-tx" class="rl-tx">
              <summary><i class="ri-file-text-line" aria-hidden="true"></i>Transcript<span id="rl-tx-which">Episode {first["ep"]}</span><i class="ri-arrow-down-s-line rl-tx-caret" aria-hidden="true"></i></summary>
              <div class="rl-tx-body">{txs}</div>
            </details>'''
    ep_json = json.dumps([{'ep': e['ep'], 'youtube': e['youtube'], 'title': e['title'], 'duration': e['duration'], 'hook': e['hook'], 'takeaway': e['takeaway'],
                           'thumbAbs': '/' + e['thumb']} for e in me], ensure_ascii=False).replace('</', '<\\/')
    if first['youtube']:
        player = (f'<div id="rl-player" class="yt-player yt-16x9" data-yt-id="{esc(first["youtube"])}" data-yt-title="{esc(first["title"])}"><a class="yt-play" href="{esc(yt(first))}" '
                  f'aria-label="Play episode {first["ep"]}: {esc(first["title"])}"><img src="/{esc(first["thumb"])}" alt="" width="640" height="360" decoding="async"><span class="yt-play-icon" aria-hidden="true"><i class="ri-play-fill"></i></span></a></div>')
    else:
        player = (f'<div id="rl-player" class="yt-16x9 em-player"><div class="em-soon"><img src="/{esc(first["thumb"])}" alt="" width="640" height="360" decoding="async">'
                  f'<span class="em-soon-badge"><i class="ri-time-line" aria-hidden="true"></i>Video coming soon</span></div></div>')
    soon = all(not e['youtube'] for e in me)
    watch = f'''      <h2 id="watch-title" class="proj-h2">Watch</h2>
      <p class="proj-lead">{plural(len(me), "short episode")} for this module. Pick one from the list, and open the transcript to read along{"" if soon else ": each timestamp plays the episode from there"}. {"The videos are being published on YouTube; until then the transcripts are here. " if soon and not any(e.get('pending') for e in me) else ""}{"Episodes marked “coming soon” are still being made. " if any(e.get('pending') for e in me) else ""}The narration is generated with a voice clone of Teddy, used with his permission.</p>
      <div class="rl-watch">
        <div class="rl-player-wrap">
          {player}
          <div class="rl-now">
            <p id="rl-now-num" class="rl-now-num">Episode {first["ep"]} · {esc(first["duration"])}</p>
            <p id="rl-now-title" class="rl-now-title">{esc(first["title"])}</p>
            <p id="rl-now-hook" class="rl-now-hook">{esc(first["hook"])}</p>
            <p id="rl-now-take" class="rl-now-take"><i class="ri-lightbulb-flash-line" aria-hidden="true"></i><span>{esc(first["takeaway"])}</span></p>
          </div>{transcript}
        </div>
        <div class="rl-eps">
          <div class="rl-eps-head"><b>Module {n} episodes</b><span>{plural(len(me), "episode")}{f' · {mins(sum(e["seconds"] for e in me))} min' if not any(e.get('pending') for e in me) else f' · {sum(1 for e in me if not e.get("pending"))} ready'}</span></div>
          <ol>{items}</ol>
        </div>
      </div>
      <script type="application/json" id="rl-episodes">{ep_json}</script>'''
    play = ''
    if m['games']:
        cards = ''.join(game_card(games[g['id']], g['why']) for g in m['games'])
        play = section('play', f'''      <h2 id="play-title" class="proj-h2">Play</h2>
      <p class="proj-lead">A game that goes with this module, and what to look for while you play.</p>
      <div class="rl-games is-1">{cards}</div>''', soft=True)
    ready = [x for x in M if x.get('ready')]
    pn = []
    prev = next((x for x in reversed(M[:n - 1]) if x.get('ready')), None)
    nxt_m = next((x for x in M[n:] if x.get('ready')), None)
    pn.append(f'<a href="{BASE}{prev["slug"]}/"><i class="ri-arrow-left-line" aria-hidden="true"></i><span><small>Previous · Module {prev["num"]}</small><strong>{esc(prev["title"])}</strong></span></a>' if prev else
              f'<a href="{BASE}"><i class="ri-arrow-left-line" aria-hidden="true"></i><span><small>Course page</small><strong>All modules</strong></span></a>')
    if nxt_m:
        pn.append(f'<a class="is-next" href="{BASE}{nxt_m["slug"]}/"><span><small>Next · Module {nxt_m["num"]}</small><strong>{esc(nxt_m["title"])}</strong></span><i class="ri-arrow-right-line" aria-hidden="true"></i></a>')
    elif n < len(M):
        pn.append(f'<a class="is-next" href="{BASE}"><span><small>Next · Module {n + 1} (in production)</small><strong>{esc(M[n]["title"])}</strong></span><i class="ri-arrow-right-line" aria-hidden="true"></i></a>')
    else:
        pn.append(f'<a class="is-next" href="{BASE}"><span><small>That’s the course</small><strong>Back to the course page</strong></span><i class="ri-arrow-right-line" aria-hidden="true"></i></a>')
    nxt = f'''      <h2 id="next-title" class="proj-h2">Keep going</h2>
      <div class="rl-pn">{"".join(pn)}</div>'''
    labs_html = lab_sections(data, m) if m['labs'] else ''
    body = '\n'.join([hero, nav, section('watch', watch, soft=True)] + ([labs_html] if labs_html else []) + ([play] if play else []) + [section('next', nxt, soft=not play)])
    url = f'{SITE}{BASE}{m["slug"]}/'
    jsonld = {'@context': 'https://schema.org', '@type': 'LearningResource', 'name': f'Module {n}: {m["title"]}', 'description': m['summary'], 'url': url,
              'inLanguage': 'en', 'isAccessibleForFree': True, 'learningResourceType': (['Lecture slides', 'Video'] if s else ['Video']) + (['Interactive resource'] if m['labs'] else []), 'teaches': m['sub'],
              'isPartOf': {'@type': 'Course', 'name': data['title'], 'url': f'{SITE}{BASE}'},
              'author': {'@type': 'Person', 'name': 'Teddy Lazebnik', 'url': 'https://teddylazebnik.com/'},
              'publisher': {'@type': 'Organization', 'name': 'Applied Computational Mathematics Laboratory', 'url': f'{SITE}/'}}
    parts_ld = [{'@type': 'VideoObject', 'name': e['title'], 'description': e['hook'], 'thumbnailUrl': f'{SITE}/{e["thumb"]}',
                 'embedUrl': f'https://www.youtube-nocookie.com/embed/{e["youtube"]}', 'duration': f'PT{e["seconds"] // 60}M{e["seconds"] % 60}S'} for e in me if e['youtube']]
    if s:
        parts_ld.append({'@type': 'DigitalDocument', 'name': f'Module {n} slides', 'encodingFormat': 'application/pdf', 'url': f'{SITE}/{s["pdf"]}'})
    if parts_ld:
        jsonld['hasPart'] = parts_ld
    (OUT / m['slug']).mkdir(parents=True, exist_ok=True)
    ok = share_image([ROOT / (s['first'] if s else first['thumb'])], OUT / m['slug'] / 'share.jpg', f'Module {n}: {m["title"]}', 'Epidemic Modeling')
    return with_labs(page(tpl.read_text(encoding='utf-8'), url=url, title=f'Module {n}: {m["title"]} | Epidemic Modeling Course | ACML',
                og_title=f'Module {n}: {m["title"]} · Epidemic Modeling',
                description=f'Module {n} of 13 of ACML’s Epidemic Modeling course. {m["sub"]}: ' + and_list((['slides'] if s else []) + [plural(len(me), 'short episode')] + (['an interactive lab'] if m['labs'] else []) + (['a game'] if m['games'] else [])) + '.',
                keywords=f'epidemic modeling, epidemiology, {m["title"].lower()}, course, ACML',
                share=f'{url}share.jpg' if ok else f'{SITE}/img/logo.png', jsonld=jsonld, body=body), bool(m['labs']))


BOOK_URL = 'https://shop.elsevier.com/books/epidemic-modeling/lazebnik/978-0-443-55525-1'
PLAYLIST_URL = ''   # the course playlist on YouTube (unlisted for now); set when it goes public
PART_TEXT = {'Foundations': 'Why epidemics unfold as they do: history, biology, behavior, economics and government.',
             'Core models': 'The models themselves: compartments, space and networks, many strains, and agents.',
             'Data and inference': 'From messy counts to fitted models: forecasting, calibration and surveillance data.',
             'Policy and practice': 'Models for decisions: interventions, uncertainty, computing, and what comes next.'}


def build_hub(data, tpl, eps):
    M = data['modules']
    ready = [m for m in M if m.get('ready')]
    book = data['book_parts']
    acts = (btn(f'{BASE}module-01/', 'ri-play-circle-line', 'Start with Module 1', True)
            + btn('#play', 'ri-flask-line', 'Labs and games') + btn(BOOK_URL, 'ri-book-open-line', 'Get the book', extra=' target="_blank" rel="noopener"')
            + (btn(PLAYLIST_URL, 'ri-youtube-line', 'Playlist on YouTube', extra=' target="_blank" rel="noopener"') if PLAYLIST_URL else ''))
    hero = f'''    <header class="proj-hero rl-hero">
      <div class="proj-wrap proj-hero-grid">
        <div>
          {crumbs(("Home", "/"), ("Courses", "/courses.html"), ("Epidemic Modeling", None))}
          <p class="proj-kicker"><span><i class="ri-graduation-cap-line" aria-hidden="true"></i>Open course materials</span><span><i class="ri-user-3-line" aria-hidden="true"></i>Prof. {esc(data["teacher"])}</span></p>
          <h1 class="proj-title">{esc(data["title"])}</h1>
          <p class="proj-subtitle">{esc(data["description"])}</p>
          <div class="em-book"><i class="ri-book-open-line" aria-hidden="true"></i><p><b>The course book.</b> {esc(book["author"])}, <a href="{BOOK_URL}" target="_blank" rel="noopener"><cite>{esc(book["title"])}</cite></a> ({esc(book["publisher"])}, {book["year"]}). Each module follows one chapter of the book; the episodes, slides and labs are written in our own words, figures and simulations. <a class="em-book-buy" href="{BOOK_URL}" target="_blank" rel="noopener">Buy the book from Elsevier <i class="ri-external-link-line" aria-hidden="true"></i></a></p></div>
          <div class="proj-actions">{acts}</div>
        </div>
        <figure class="rl-art em-cover"><a href="{BOOK_URL}" target="_blank" rel="noopener" aria-label="The course book on the Elsevier shop"><img src="/{esc(data["cover_img"])}" alt="Cover of the course book: Epidemic Modeling: Principles, Algorithms, and Applications, by Teddy Lazebnik" width="640" height="954" fetchpriority="high" decoding="async"></a></figure>
      </div>
    </header>'''
    nav = subnav([('how', 'How to study'), ('modules', 'Modules'), ('play', 'Labs and games')])
    n_labs = len(data.get('labs', []))
    how = section('how', f'''      <h2 id="how-title" class="proj-h2">How to study each module</h2>
      <p class="proj-lead">Every module page brings the same four things together. Use them in any order; this one works well.</p>
      <div class="rl-steps is-4">
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-play-circle-line" aria-hidden="true"></i></span><h3>Watch</h3><p>Start with the module’s short animated episodes, three to six minutes each, with a transcript to read along. They give the intuition first.</p></div>
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-slideshow-line" aria-hidden="true"></i></span><h3>Read the slides</h3><p>Each deck is written to be read on your own: worked examples, “try it” boxes, our own small simulations, and check-yourself questions with answers at the end. The matching chapter of the <a href="{BOOK_URL}" target="_blank" rel="noopener">course book</a> goes deeper.</p></div>
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-flask-line" aria-hidden="true"></i></span><h3>Try it</h3><p>Run the models yourself in the browser: {n_labs} labs, from a <a href="{BASE}module-02/#lab">behavior lab</a> in Module 2 to a <a href="{BASE}module-12/#lab">step-size lab</a> in Module 12.</p></div>
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-gamepad-line" aria-hidden="true"></i></span><h3>Play</h3><p>In <a href="/mayor-outbreak.html">Mayor’s Outbreak</a> you steer a city through an epidemic. Modules 1, 10 and 13 say what to look for while you play.</p></div>
      </div>''')
    groups = ''
    for pi, p in enumerate(data['parts'], 1):
        cards = ''
        for k in p['modules']:
            m = M[k - 1]; me = [eps[x] for x in m['episodes']]
            done = [e for e in me if not e.get('pending')]
            meta = []
            if m['slides']: meta.append(f'<span><i class="ri-slideshow-line" aria-hidden="true"></i>{m["slides"]["pages"]} slides</span>')
            ep_txt = f'{plural(len(me), "episode")} · {mins(sum(e["seconds"] for e in me))} min' if len(done) == len(me) else f'{plural(len(me), "episode")} · {len(done)} ready'
            meta.append(f'<span><i class="ri-play-circle-line" aria-hidden="true"></i>{ep_txt}</span>')
            if m['labs']: meta.append('<span><i class="ri-flask-line" aria-hidden="true"></i>Lab</span>')
            if m['games']: meta.append('<span><i class="ri-gamepad-line" aria-hidden="true"></i>Game</span>')
            cards += (f'<a class="rl-lec-card" href="{BASE}{m["slug"]}/"><img src="/epidemic-modeling/img/modules/m{k:02d}.webp" alt="Concept illustration for Module {k}: {esc(m["title"])}" width="960" height="540" loading="lazy" decoding="async"><div class="rl-lec-body">'
                      f'<span class="rl-lec-num">Module {k}</span><span class="rl-lec-title">{esc(m["title"])}</span><span class="rl-lec-text">{esc(m["sub"])}</span>'
                      f'<span class="rl-lec-meta">{"".join(meta)}</span></div></a>')
        n = len(p['modules'])
        groups += (f'<div class="rl-part"><div class="rl-part-head"><h3><span>Part {pi}</span>{esc(p["title"])}</h3><p>{esc(PART_TEXT.get(p["title"], ""))}</p></div>'
                   f'<div class="rl-lec-grid is-{n if n in (2, 3, 4) else 3}">{cards}</div></div>')
    mods = section('modules', f'''      <h2 id="modules-title" class="proj-h2">The 13 modules</h2>
      <p class="proj-lead">From the history of pandemics to the computing behind large simulations. Each card opens the module page with its episodes, slides, lab and game.</p>
      <div style="margin-top:1.75rem">{groups}</div>''', soft=True)
    labs = [x for x in data.get('labs', []) if M[x['module'] - 1].get('ready')]
    lab_cards = ''.join(f'<a class="tool-card em-lab" href="{BASE}{M[x["module"] - 1]["slug"]}/#lab"><div class="card-body"><span class="em-lab-icon"><i class="{x["icon"]}" aria-hidden="true"></i></span>'
                        f'<p class="card-title">{esc(x["title"])}</p><p class="card-text">{esc(x["card"])}</p><span class="card-more">Module {x["module"]} lab <i class="ri-arrow-right-line" aria-hidden="true"></i></span></div></a>' for x in labs)
    labs_block = (f'<p class="proj-lead">The labs run the course’s models in your browser.</p><div class="em-grid em-labs">{lab_cards}</div>'
                  f'<h3 class="proj-h3" style="margin-top:2rem">Game</h3>') if lab_cards else ''
    g = data['games'][0]
    play = section('play', f'''      <h2 id="play-title" class="proj-h2">{"Labs and games" if lab_cards else "Play"}</h2>
      {labs_block}
      <div class="rl-games is-1">{game_card(g, "used in Modules 1, 10 and 13: steer a city through an outbreak, and see the trade-offs that the course turns into models.", "In this course")}</div>''')
    body = '\n'.join([hero, nav, how, mods, play])
    url = f'{SITE}{BASE}'
    jsonld = {'@context': 'https://schema.org', '@type': 'Course', 'name': data['title'], 'description': data['description'], 'url': url, 'inLanguage': 'en',
              'isAccessibleForFree': True, 'provider': {'@type': 'Organization', 'name': 'Applied Computational Mathematics Laboratory', 'url': f'{SITE}/'},
              'author': {'@type': 'Person', 'name': 'Teddy Lazebnik', 'url': 'https://teddylazebnik.com/'},
              'hasPart': [{'@type': 'LearningResource', 'name': f'Module {m["num"]}: {m["title"]}', 'url': f'{SITE}{BASE}{m["slug"]}/'} for m in ready]}
    OUT.mkdir(parents=True, exist_ok=True)
    ok = share_image([ROOT / data['hero_share']], OUT / 'share.jpg', data['title'], 'An ACML course')
    return page(tpl.read_text(encoding='utf-8'), url=url, title='Epidemic Modeling Course | ACML', og_title='Epidemic Modeling · an ACML course',
                description=data['description'], keywords='epidemic modeling, epidemiology, SIR model, course, pandemics, ACML',
                share=f'{url}share.jpg' if ok else f'{SITE}/img/logo.png', jsonld=jsonld, body=body)


MARK_START, MARK_END = 'epidemic modeling course pages: start (made by tools/build_epi_course.py)', 'epidemic modeling course pages: end'


def update_sitemap(data, today):
    path = ROOT / 'sitemap.xml'
    if not path.exists():
        return
    raw = path.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); text = raw.decode('utf-8-sig'); eol = '\r\n' if '\r\n' in text else '\n'
    old = dict(re.findall(r'<loc>(.*?)</loc>\s*<lastmod>(.*?)</lastmod>', text))
    pages = [(BASE.strip('/') + '/', '0.85', [data['hero_img'], 'epidemic-modeling/share.jpg'])]
    pages += [(f'{BASE.strip("/")}/{m["slug"]}/', '0.80', [m['slides']['first']] if m['slides'] else []) for m in data['modules'] if m.get('ready')]
    lines = [f'  <!-- {MARK_START} -->']
    for path_, pr, imgs in pages:
        loc = f'{SITE}/{path_}'
        lines += ['  <url>', f'    <loc>{loc}</loc>', f'    <lastmod>{old.get(loc, today + "T00:00:00.000Z")}</lastmod>', f'    <priority>{pr}</priority>']
        lines += [f'    <image:image><image:loc>{SITE}/{i}</image:loc></image:image>' for i in imgs]
        lines.append('  </url>')
    lines.append(f'  <!-- {MARK_END} -->')
    block = '\n'.join(lines) + '\n'
    t = text.replace('\r\n', '\n')
    new = replace_block(t, MARK_START, MARK_END, block)
    if new is None:
        anchor = t.find('  <!-- project pages: start')
        i = anchor if anchor != -1 else t.index('</urlset>')
        new = t[:i] + block + t[i:]
    write_keep(path, new, bom, eol)


def update_llms(data, eps):
    path = ROOT / 'llms.txt'
    if not path.exists():
        return
    raw = path.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); text = raw.decode('utf-8-sig'); eol = '\r\n' if '\r\n' in text else '\n'
    ready = [m for m in data['modules'] if m.get('ready')]
    lines = [f'<!-- {MARK_START} -->', '## Course: Epidemic Modeling', '',
             f'An open course on epidemic modeling by Teddy Lazebnik ({SITE}{BASE}): 13 modules, one per chapter of his textbook {data["book"]}, '
             'each with short animated episodes (with transcripts) and, for Modules 1 to 12, a slide deck (PDF). The episodes, slides and simulations are written and drawn for ACML; nothing is copied from the book. '
             f'Modules go online one at a time; {len(ready)} of 13 are online now.', '']
    for m in ready:
        me = [eps[k] for k in m['episodes']]
        lines.append(f'- [Module {m["num"]}: {m["title"]}]({SITE}{BASE}{m["slug"]}/): {m["sub"]}. '
                     + (f'Slides: {SITE}/{m["slides"]["pdf"]} ({m["slides"]["pages"]} pages). ' if m['slides'] else '')
                     + 'Episodes: ' + '; '.join(f'Ep. {e["ep"]} “{e["title"]}”' for e in me) + '.')
    lines += ['', f'<!-- {MARK_END} -->']
    block = '\n'.join(lines) + '\n'
    t = text.replace('\r\n', '\n')
    new = replace_block(t, MARK_START, MARK_END, block)
    if new is None:
        anchor = t.find('<!-- project pages: start')
        new = (t[:anchor] + block + '\n' + t[anchor:]) if anchor != -1 else t.rstrip() + '\n\n' + block
    write_keep(path, new, bom, eol)


def main():
    data = json.loads(DATA.read_text(encoding='utf-8'))
    eps = {e['ep']: e for e in data['episodes']}
    built = []
    (OUT / 'index.html').write_text(build_hub(data, TPL, eps), encoding='utf-8'); built.append(BASE)
    for m in data['modules']:
        if m.get('ready'):
            (OUT / m['slug'] / 'index.html').write_text(build_module(data, TPL, eps, m), encoding='utf-8'); built.append(f'{BASE}{m["slug"]}/')
    update_sitemap(data, datetime.date.today().isoformat())
    update_llms(data, eps)
    print('built', built)


if __name__ == '__main__':
    main()
