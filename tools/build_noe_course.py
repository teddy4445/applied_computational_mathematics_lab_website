"""Build the Computational Approaches to the Non-Observed Economy course pages from data/noe-course.json:
  /non-observed-economy/              hub (all 9 modules; modules not built yet show as "in production")
  /non-observed-economy/module-NN/    one page per finished module (slides, videos with transcripts, labs)
Run: python tools/build_noe_course.py   (standard library + Pillow; reuses the helpers of tools/build_rl_course.py and tools/build_epi_course.py)"""
import json, sys, datetime, re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_rl_course import esc, mins, plural, and_list, btn, crumbs, subnav, section, share_image, page, write_keep, replace_block  # noqa: E402
import build_rl_course as _brc  # noqa: E402
from build_epi_course import fmt_t  # noqa: E402   (importing it points _brc.DATA at the epidemic data; reset below)

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://acml.teddylazebnik.com'
DATA = ROOT / 'data' / 'noe-course.json'
_brc.DATA = DATA   # share_image() compares against the data file's time
TPL = ROOT / 'tools' / 'templates' / 'noe-course.html'
OUT = ROOT / 'non-observed-economy'
BASE = '/non-observed-economy/'
TPLDIR = ROOT / 'tools' / 'templates'
LAB_TEMPLATES = {k: f'noe-lab-{k}.html' for k in ('observers', 'countries', 'audit', 'estimate', 'nowcast', 'map', 'town', 'policy', 'study')}   # lab id -> markup; the script is js/noe-labs.js
LAB_CSS = ['<link href="/css/exploration-lab.css" rel="stylesheet">', '<link href="/css/rl-labs.css" rel="stylesheet">']
NAME = 'Computational Approaches to the Non-Observed Economy'
SHORT = 'The Non-Observed Economy'


def with_labs(html_, has_labs):
    if not has_labs:
        return html_
    html_ = html_.replace('<link href="/css/tailwind.css" rel="stylesheet">', '\n      '.join(LAB_CSS) + '\n      <link href="/css/tailwind.css" rel="stylesheet">', 1)
    return html_.replace('<script src="/js/epi-course.js" defer></script>', '<script src="/js/noe-labs.js" defer></script>\n      <script src="/js/epi-course.js" defer></script>', 1)


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


def transcript_html(e, hidden):
    parts = ''.join(f'<div class="rl-tx-ch"><a class="rl-tx-t" href="{esc(yt(e, int(c["s"])))}" data-ep="{e["ep"]}" data-t="{int(c["s"])}">{fmt_t(c["s"])}</a>'
                    f'<p><b>{esc(c["title"])}.</b> {esc(c["text"])}</p></div>' for c in e['transcript'])
    if e.get('pending'): parts = '<div class="rl-tx-ch"><p>This video is still being made. Its transcript will appear here when it is finished.</p></div>'
    return f'<div class="rl-tx-ep" data-ep="{e["ep"]}"{" hidden" if hidden else ""}>{parts}</div>'


def vids_meta(me):
    """'2 videos · 27 min', or the share still in production"""
    done = [e for e in me if e['youtube']]
    if not done: return f'{plural(len(me), "video")} · coming soon'
    if len(done) < len(me): return f'{plural(len(me), "video")} · {len(done)} online ({mins(sum(e["seconds"] for e in done))} min)'
    return f'{plural(len(me), "video")} · {mins(sum(e["seconds"] for e in me))} min'


def ep_block(e, i, mod):
    return (f'<li id="ep-{e["ep"]}"><a class="rl-ep{" is-active" if i == 0 else ""}" data-ep="{e["ep"]}" href="{esc(yt(e))}"{" aria-current=true" if i == 0 else ""}>'
            f'<span class="rl-ep-thumb"><img src="/{esc(e["thumb"])}" alt="" width="640" height="360" loading="lazy" decoding="async"><span>{esc(e["duration"])}</span></span>'
            f'<span><span class="rl-ep-num">Video {e["ep"]} · {mod}.{e["k"]}</span><span class="rl-ep-title" style="display:block">{esc(e["title"])}</span>'
            f'<span class="rl-ep-take" style="display:block">{esc(e["takeaway"])}</span></span></a></li>')


def build_module(data, tpl, eps, m):
    M = data['modules']; n = m['num']
    me = [eps[k] for k in m['episodes']]
    part = next(p for p in data['parts'] if n in p['modules'])
    s = m['slides']; first = me[0]
    ideas = ''.join(f'<li><a href="#ep-{e["ep"]}">Video {e["ep"]}</a><span>{esc(e["takeaway"])}</span></li>' for e in me)
    pdf = '/' + s['pdf']
    slides_html = f'''
        <div class="rl-first">
          <a class="rl-first-img" href="{esc(pdf)}" target="_blank" rel="noopener"><img src="/{esc(s["first"])}" alt="The title slide of Module {n}: {esc(m["title"])}" width="960" height="540" fetchpriority="high" decoding="async"></a>
          <p class="rl-first-text">{s["pages"]} slides, written to be read on your own, with worked examples, our own small simulations and check-yourself questions (answers at the end). PDF, {s["mb"]} MB.</p>
          <div class="proj-actions">{btn(pdf, "ri-external-link-line", "Open the PDF", True, True)}{btn(pdf, "ri-download-2-line", "Download", extra=" download")}</div>
        </div>'''
    hero = f'''    <header class="proj-hero rl-hero">
      <div class="proj-wrap proj-hero-grid">
        <div>
          {crumbs(("Home", "/"), ("Courses", "/courses.html"), (NAME, BASE), (f"Module {n}", None))}
          <p class="proj-kicker"><span><i class="ri-graduation-cap-line" aria-hidden="true"></i>{esc(data["title"])}</span><span>{esc(part["title"])}</span></p>
          <h1 class="proj-title"><small>Module {n}</small>{esc(m["title"])}</h1>
          <p class="proj-about-lead rl-summary">{esc(m["summary"])}</p>
          <div class="rl-goal"><i class="ri-focus-3-line" aria-hidden="true"></i><span>By the end you should be able to {esc(m["goal"])}</span></div>
          <h2 class="proj-h3 rl-ideas-title">Key ideas, one per video</h2>
          <ul class="rl-ideas">{ideas}</ul>
          <p class="rl-source"><b>Book:</b> Chapter {n} of <cite>{esc(data["book_parts"]["title"])}</cite> (coming soon). The videos and slides follow the chapter’s topics in our own words, figures and simulations; the towns and countries are invented, and nothing is copied from the book.</p>
        </div>{slides_html}
      </div>
    </header>'''
    menu = [('watch', 'Watch')] + ([('lab', 'Lab')] if m['labs'] else []) + [('next', 'Next')]
    nav = subnav(menu, mobile_only=True)
    items = ''.join(ep_block(e, i, n) for i, e in enumerate(me))
    txs = ''.join(transcript_html(e, i > 0) for i, e in enumerate(me))
    transcript = f'''
            <details id="rl-tx" class="rl-tx">
              <summary><i class="ri-file-text-line" aria-hidden="true"></i>Transcript<span id="rl-tx-which">Video {first["ep"]}</span><i class="ri-arrow-down-s-line rl-tx-caret" aria-hidden="true"></i></summary>
              <div class="rl-tx-body">{txs}</div>
            </details>'''
    ep_json = json.dumps([{'ep': e['ep'], 'youtube': e['youtube'], 'title': e['title'], 'duration': e['duration'], 'hook': e['hook'], 'takeaway': e['takeaway'],
                           'thumbAbs': '/' + e['thumb']} for e in me], ensure_ascii=False).replace('</', '<\\/')
    if first['youtube']:
        player = (f'<div id="rl-player" class="yt-player yt-16x9" data-yt-id="{esc(first["youtube"])}" data-yt-title="{esc(first["title"])}"><a class="yt-play" href="{esc(yt(first))}" '
                  f'aria-label="Play video {first["ep"]}: {esc(first["title"])}"><img src="/{esc(first["thumb"])}" alt="" width="640" height="360" decoding="async"><span class="yt-play-icon" aria-hidden="true"><i class="ri-play-fill"></i></span></a></div>')
    else:
        player = (f'<div id="rl-player" class="yt-16x9 em-player"><div class="em-soon"><img src="/{esc(first["thumb"])}" alt="" width="640" height="360" decoding="async">'
                  f'<span class="em-soon-badge"><i class="ri-time-line" aria-hidden="true"></i>Video coming soon</span></div></div>')
    soon = all(not e['youtube'] for e in me); some = any(not e['youtube'] for e in me)
    how = ("They are still being made, and will play here as each one is published, with a transcript to read along. " if soon else
           "Pick one from the list, and open the transcript to read along: each timestamp plays the video from there. " + ("Videos marked coming soon are still being made; they will appear here as they are published. " if some else ""))
    watch = f'''      <h2 id="watch-title" class="proj-h2">Watch</h2>
      <p class="proj-lead">{plural(len(me), "video")} for this module, each about 8 to 11 minutes. {how}The narration is generated with a voice clone of Teddy, used with his permission.</p>
      <div class="rl-watch">
        <div class="rl-player-wrap">
          {player}
          <div class="rl-now">
            <p id="rl-now-num" class="rl-now-num">Video {first["ep"]} · {esc(first["duration"])}</p>
            <p id="rl-now-title" class="rl-now-title">{esc(first["title"])}</p>
            <p id="rl-now-hook" class="rl-now-hook">{esc(first["hook"])}</p>
            <p id="rl-now-take" class="rl-now-take"><i class="ri-lightbulb-flash-line" aria-hidden="true"></i><span>{esc(first["takeaway"])}</span></p>
          </div>{transcript}
        </div>
        <div class="rl-eps">
          <div class="rl-eps-head"><b>Module {n} videos</b><span>{vids_meta(me)}</span></div>
          <ol>{items}</ol>
        </div>
      </div>
      <script type="application/json" id="rl-episodes">{ep_json}</script>'''
    prev = next((x for x in reversed(M[:n - 1]) if x.get('ready')), None)
    nxt_m = next((x for x in M[n:] if x.get('ready')), None)
    pn = [f'<a href="{BASE}{prev["slug"]}/"><i class="ri-arrow-left-line" aria-hidden="true"></i><span><small>Previous · Module {prev["num"]}</small><strong>{esc(prev["title"])}</strong></span></a>' if prev else
          f'<a href="{BASE}"><i class="ri-arrow-left-line" aria-hidden="true"></i><span><small>Course page</small><strong>All modules</strong></span></a>']
    if nxt_m:
        pn.append(f'<a class="is-next" href="{BASE}{nxt_m["slug"]}/"><span><small>Next · Module {nxt_m["num"]}</small><strong>{esc(nxt_m["title"])}</strong></span><i class="ri-arrow-right-line" aria-hidden="true"></i></a>')
    elif n < len(M):
        pn.append(f'<a class="is-next" href="{BASE}"><span><small>Next · Module {n + 1} (in production)</small><strong>{esc(M[n]["title"])}</strong></span><i class="ri-arrow-right-line" aria-hidden="true"></i></a>')
    else:
        pn.append(f'<a class="is-next" href="{BASE}"><span><small>That’s the course</small><strong>Back to the course page</strong></span><i class="ri-arrow-right-line" aria-hidden="true"></i></a>')
    nxt = f'''      <h2 id="next-title" class="proj-h2">Keep going</h2>
      <div class="rl-pn">{"".join(pn)}</div>'''
    labs_html = lab_sections(data, m) if m['labs'] else ''
    body = '\n'.join([hero, nav, section('watch', watch, soft=True)] + ([labs_html] if labs_html else []) + [section('next', nxt, soft=True)])
    url = f'{SITE}{BASE}{m["slug"]}/'
    jsonld = {'@context': 'https://schema.org', '@type': 'LearningResource', 'name': f'Module {n}: {m["title"]}', 'description': m['summary'], 'url': url,
              'inLanguage': 'en', 'isAccessibleForFree': True, 'learningResourceType': ['Lecture slides', 'Video'] + (['Interactive resource'] if m['labs'] else []), 'teaches': m['sub'],
              'isPartOf': {'@type': 'Course', 'name': data['title'], 'url': f'{SITE}{BASE}'},
              'author': {'@type': 'Person', 'name': 'Teddy Lazebnik', 'url': 'https://teddylazebnik.com/'},
              'publisher': {'@type': 'Organization', 'name': 'Applied Computational Mathematics Laboratory', 'url': f'{SITE}/'}}
    parts_ld = [{'@type': 'VideoObject', 'name': e['title'], 'description': e['hook'], 'thumbnailUrl': f'{SITE}/{e["thumb"]}',
                 'embedUrl': f'https://www.youtube-nocookie.com/embed/{e["youtube"]}', 'duration': f'PT{e["seconds"] // 60}M{e["seconds"] % 60}S'} for e in me if e['youtube']]
    parts_ld.append({'@type': 'DigitalDocument', 'name': f'Module {n} slides', 'encodingFormat': 'application/pdf', 'url': f'{SITE}/{s["pdf"]}'})
    jsonld['hasPart'] = parts_ld
    (OUT / m['slug']).mkdir(parents=True, exist_ok=True)
    ok = share_image([ROOT / s['first']], OUT / m['slug'] / 'share.jpg', f'Module {n}: {m["title"]}', NAME)
    return with_labs(page(tpl.read_text(encoding='utf-8'), url=url, title=f'Module {n}: {m["title"]} | {NAME} Course | ACML',
                og_title=f'Module {n}: {m["title"]} · {NAME}',
                description=f'Module {n} of 9 of ACML’s {NAME} course. {m["sub"]}: ' + and_list(['slides', plural(len(me), 'video')] + (['an interactive lab'] if m['labs'] else [])) + '.',
                keywords=f'non-observed economy, informal economy, shadow economy, computational economics, {m["title"].lower()}, course, ACML',
                share=f'{url}share.jpg' if ok else f'{SITE}/img/logo.png', jsonld=jsonld, body=body), bool(m['labs']))


PART_TEXT = {'Foundations': 'What is missing from the accounts and why, how theory and data meet, and the games between observers and the observed.',
             'Measuring': 'Estimating the size with honest errors, and forecasting a quantity nobody sees.',
             'Space and systems': 'Where hidden activity happens and through which links, and agent-based models from micro to macro.',
             'Policy and practice': 'Designing policy under uncertainty, and a practical guide from a question to a defensible answer.'}


def build_hub(data, tpl, eps):
    M = data['modules']
    ready = [m for m in M if m.get('ready')]
    book = data['book_parts']
    acts = (btn(f'{BASE}module-01/', 'ri-play-circle-line', 'Start with Module 1', True) + btn('#modules', 'ri-list-check-2', 'All modules') + btn('#labs', 'ri-flask-line', 'Labs')
            + '<a class="proj-btn" aria-disabled="true" title="The book is coming soon"><i class="ri-book-open-line" aria-hidden="true"></i>Buy the book</a>')   # no link yet: add href when the book is out
    hero = f'''    <header class="proj-hero rl-hero">
      <div class="proj-wrap proj-hero-grid">
        <div>
          {crumbs(("Home", "/"), ("Courses", "/courses.html"), (NAME, None))}
          <p class="proj-kicker"><span><i class="ri-graduation-cap-line" aria-hidden="true"></i>Open course materials</span><span><i class="ri-user-3-line" aria-hidden="true"></i>Prof. {esc(data["teacher"])}</span></p>
          <h1 class="proj-title">{esc(data["title"])}</h1>
          <p class="proj-subtitle">{esc(data["description"])}</p>
          <div class="em-book"><i class="ri-book-open-line" aria-hidden="true"></i><p><b>The course book.</b> {(esc(book["author"]) + ", ") if book.get("author") else ""}<cite>{esc(book["title"])}</cite>. Coming soon. Each module follows one chapter of the book; the videos, slides and labs are written in our own words, figures and simulations, with invented towns and countries.</p></div>
          <div class="proj-actions">{acts}</div>
        </div>
        <figure class="rl-art"><img src="/{esc(data["cover_img"])}" alt="Night Atlas illustration: an invented land seen from orbit at night, with two observers' searchlights lighting part of it" width="960" height="600" fetchpriority="high" decoding="async"></figure>
      </div>
    </header>'''
    nav = subnav([('how', 'How to study'), ('modules', 'Modules'), ('labs', 'Labs')])
    how = section('how', f'''      <h2 id="how-title" class="proj-h2">How to study each module</h2>
      <p class="proj-lead">Every module page brings the same three things together. Use them in any order; this one works well.</p>
      <div class="rl-steps is-3">
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-play-circle-line" aria-hidden="true"></i></span><h3>Watch</h3><p>Two or three animated videos per module, 8 to 11 minutes each, drawn on a night map as they go, with a transcript to read along. Many pause for you to predict a result first, and every one works through examples with our own numbers.</p></div>
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-slideshow-line" aria-hidden="true"></i></span><h3>Read the slides</h3><p>Each deck is written to be read on your own: worked examples, our own small simulations, common pitfalls, and check-yourself questions with answers at the end. The matching chapter of the book goes deeper.</p></div>
        <div class="rl-step"><span class="rl-step-icon"><i class="ri-flask-line" aria-hidden="true"></i></span><h3>Try it</h3><p>Every module has a lab that runs in your browser, starting with <a href="{BASE}module-01/#lab">Lantern Bay’s observers</a> in Module 1. The challenges are checked as you go.</p></div>
      </div>''')
    groups = ''
    for pi, p in enumerate(data['parts'], 1):
        cards = ''
        for k in p['modules']:
            m = M[k - 1]; me = [eps[x] for x in m['episodes']]
            meta = []
            if m.get('ready'):
                meta.append(f'<span><i class="ri-slideshow-line" aria-hidden="true"></i>{m["slides"]["pages"]} slides</span>')
                meta.append(f'<span><i class="ri-play-circle-line" aria-hidden="true"></i>{vids_meta(me)}</span>')
                if m['labs']: meta.append('<span><i class="ri-flask-line" aria-hidden="true"></i>Lab</span>')
            else:
                meta.append(f'<span><i class="ri-time-line" aria-hidden="true"></i>In production · {plural(len(me), "video")}</span>')
            img = f'/non-observed-economy/img/modules/m{k:02d}.webp'
            inner = (f'<img src="{img}" alt="Night Atlas plate for Module {k}: {esc(m["title"])}" width="960" height="540" loading="lazy" decoding="async"><div class="rl-lec-body">'
                     f'<span class="rl-lec-num">Module {k}</span><span class="rl-lec-title">{esc(m["title"])}</span><span class="rl-lec-text">{esc(m["sub"])}</span>'
                     f'<span class="rl-lec-meta">{"".join(meta)}</span></div>')
            cards += f'<a class="rl-lec-card" href="{BASE}{m["slug"]}/">{inner}</a>' if m.get('ready') else f'<div class="rl-lec-card is-soon" aria-disabled="true">{inner}</div>'
        n = len(p['modules'])
        groups += (f'<div class="rl-part"><div class="rl-part-head"><h3><span>Part {pi}</span>{esc(p["title"])}</h3><p>{esc(PART_TEXT.get(p["title"], ""))}</p></div>'
                   f'<div class="rl-lec-grid is-{n if n in (2, 3, 4) else 3}">{cards}</div></div>')
    mods = section('modules', f'''      <h2 id="modules-title" class="proj-h2">The 9 modules</h2>
      <p class="proj-lead">From what goes unobserved, and why, to estimating, forecasting, mapping and simulating it, and designing policy around it. Modules go online one at a time; each card opens the module page with its videos, slides and lab.</p>
      <div style="margin-top:1.75rem">{groups}</div>''', soft=True)
    labs = [x for x in data.get('labs', []) if M[x['module'] - 1].get('ready')]
    lab_cards = ''.join(f'<a class="tool-card em-lab" href="{BASE}{M[x["module"] - 1]["slug"]}/#lab"><div class="card-body"><span class="em-lab-icon"><i class="{x["icon"]}" aria-hidden="true"></i></span>'
                        f'<p class="card-title">{esc(x["title"])}</p><p class="card-text">{esc(x["card"])}</p><span class="card-more">Module {x["module"]} lab <i class="ri-arrow-right-line" aria-hidden="true"></i></span></div></a>' for x in labs)
    labs_sec = section('labs', f'''      <h2 id="labs-title" class="proj-h2">Labs</h2>
      <p class="proj-lead">The labs run the course’s ideas in your browser, with challenges that are checked as you go. One lab per module; new ones appear as modules go online.</p>
      <div class="em-grid em-labs">{lab_cards}</div>''')
    body = '\n'.join([hero, nav, how, mods, labs_sec])
    url = f'{SITE}{BASE}'
    jsonld = {'@context': 'https://schema.org', '@type': 'Course', 'name': data['title'], 'description': data['description'], 'url': url, 'inLanguage': 'en',
              'isAccessibleForFree': True, 'provider': {'@type': 'Organization', 'name': 'Applied Computational Mathematics Laboratory', 'url': f'{SITE}/'},
              'author': {'@type': 'Person', 'name': 'Teddy Lazebnik', 'url': 'https://teddylazebnik.com/'},
              'hasPart': [{'@type': 'LearningResource', 'name': f'Module {m["num"]}: {m["title"]}', 'url': f'{SITE}{BASE}{m["slug"]}/'} for m in ready]}
    OUT.mkdir(parents=True, exist_ok=True)
    ok = share_image([ROOT / data['hero_share']], OUT / 'share.jpg', data['title'], 'An ACML course')
    return page(tpl.read_text(encoding='utf-8'), url=url, title=f'{NAME} Course | ACML', og_title=f'{NAME} · an ACML course',
                description=data['description'], keywords='non-observed economy, informal economy, shadow economy, tax evasion, computational economics, machine learning, course, ACML',
                share=f'{url}share.jpg' if ok else f'{SITE}/img/logo.png', jsonld=jsonld, body=body)


MARK_START, MARK_END = 'non-observed economy course pages: start (made by tools/build_noe_course.py)', 'non-observed economy course pages: end'


def update_sitemap(data, today):
    path = ROOT / 'sitemap.xml'
    if not path.exists():
        return
    raw = path.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); text = raw.decode('utf-8-sig'); eol = '\r\n' if '\r\n' in text else '\n'
    old = dict(re.findall(r'<loc>(.*?)</loc>\s*<lastmod>(.*?)</lastmod>', text))
    pages = [(BASE.strip('/') + '/', '0.85', [data['hero_img'], 'non-observed-economy/share.jpg'])]
    pages += [(f'{BASE.strip("/")}/{m["slug"]}/', '0.80', [m['slides']['first']]) for m in data['modules'] if m.get('ready')]
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
    lines = [f'<!-- {MARK_START} -->', f'## Course: {NAME}', '',
             f'An open course on studying the non-observed economy (informal, underground, illegal and unrecorded production) with computation, by Teddy Lazebnik ({SITE}{BASE}): 9 modules, one per chapter of the forthcoming book '
             f'{data["book_parts"]["title"]}, each with two or three long animated videos (with transcripts), a slide deck (PDF) and a browser lab. '
             f'The videos, slides and simulations are written and drawn for ACML, with invented towns and countries; nothing is copied from the book. Modules go online one at a time; {len(ready)} of 9 are online now.', '']
    for m in ready:
        me = [eps[k] for k in m['episodes']]
        lines.append(f'- [Module {m["num"]}: {m["title"]}]({SITE}{BASE}{m["slug"]}/): {m["sub"]}. Slides: {SITE}/{m["slides"]["pdf"]} ({m["slides"]["pages"]} pages). '
                     + 'Videos: ' + '; '.join(f'Video {e["ep"]} “{e["title"]}”' for e in me) + '.')
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
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'index.html').write_text(build_hub(data, TPL, eps), encoding='utf-8'); built.append(BASE)
    for m in data['modules']:
        if m.get('ready'):
            (OUT / m['slug'] / 'index.html').write_text(build_module(data, TPL, eps, m), encoding='utf-8'); built.append(f'{BASE}{m["slug"]}/')
    update_sitemap(data, datetime.date.today().isoformat())
    update_llms(data, eps)
    print('built', built)


if __name__ == '__main__':
    main()
