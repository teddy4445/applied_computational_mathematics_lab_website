#!/usr/bin/env python3
"""Build the numbers, charts and tables of statistics-demo.html.

    python tools/build_statistics.py

Reads:
  data/coauthor-affiliations.json  who co-wrote each paper and where they were, as printed on the paper
  data/journals.json               publisher, open-access status and SCImago quartile of each journal
  data/lab.json                    lab members, their roles and dates
  data/academic-publications.json  topic of each paper
  publications/*/paper.json        title, year, journal, licence, authors and the received / accepted / published dates

Writes, between the "stats ..." markers in statistics-demo.html: the numbers at the top, one JSON block with the data
every chart draws (read by js/coauthor-map.js and js/stats-charts.js), and a plain table for every chart, so the page
reads in full without JavaScript. Also writes data/collab-map.js, the map data for the collaboration map on team.html.
Run it again after adding papers, lab members or journal details.
"""
import collections
import datetime as dt
import html
import json
import re
import statistics
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / 'statistics-demo.html'
PI = 'Teddy Lazebnik'
HUBS = {'Haifa, Israel': 'University of Haifa', 'Jönköping, Sweden': 'Jönköping University'}
TOPIC_ORDER = ['Machine Learning', 'Biomathematics', 'Epidemiology', 'Economics', 'Social', 'AI', 'Scientometrics']
ROLE_GROUPS = [('Postdocs and PhD students', ('post', 'phd', 'lab manager')), ('MSc students', ('msc', 'master')),
               ('BSc students and research assistants', ('bsc', 'bachelor', 'research assistant'))]
TITLE_RE = re.compile(r'^(Prof\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s+')
MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split()


# ---------------------------------------------------------------- helpers
def esc(s):
    return html.escape(str(s), quote=True)


def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8-sig'))


def norm(s):
    s = unicodedata.normalize('NFKD', s or '')
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if not unicodedata.combining(c)).lower())


def name_keys(name):
    """The whole name, the name without initials, and first + last name, so 'Brittany N. Florkiewicz' = 'Brittany Florkiewicz'."""
    name = TITLE_RE.sub('', (name or '').strip())
    parts = [p for p in re.split(r'[\s\-]+', name) if norm(p)]
    keys = {norm(name)}
    long_parts = [p for p in parts if len(norm(p)) > 1]
    if long_parts:
        keys.add(''.join(norm(p) for p in long_parts))
    if len(long_parts) >= 2:
        keys.add(norm(long_parts[0]) + '|' + norm(long_parts[-1]))
    return keys


def date(s):
    try:
        return dt.date.fromisoformat((s or '').strip()[:10])
    except ValueError:
        return None


def dmy(s):
    """lab.json dates are day/month/year ('1/10/2023'); 'Current' means still here."""
    m = re.match(r'^\s*(\d{1,2})/(\d{1,2})/(\d{4})\s*$', s or '')
    return f'{int(m.group(3)):04d}-{int(m.group(2)):02d}' if m else None


def month_label(ym):
    return f'{MONTHS[int(ym[5:7]) - 1]} {ym[:4]}' if ym else ''


def median(xs):
    return round(statistics.median(xs), 1) if xs else None


def replace_block(text, name, block):
    start = f'<!-- {name}: start (made by tools/build_statistics.py) -->'
    end = f'<!-- {name}: end -->'
    a, b = text.index(start), text.index(end)
    return text[:a + len(start)] + '\n' + block + '\n' + text[b:]


def table(head, rows, cls=''):
    th = ''.join(f'<th scope="col"{" class=num" if h.startswith("#") else ""}>{esc(h.lstrip("#"))}</th>' for h in head)
    return (f'            <table class="cm-table{" " + cls if cls else ""}"><thead><tr>{th}</tr></thead><tbody>\n' +
            '\n'.join(f'              <tr>{r}</tr>' for r in rows) + '\n            </tbody></table>')


def paper_link(slug, title):
    return f'<a href="publications/{esc(slug)}/">{esc(title)}</a>'


# ---------------------------------------------------------------- the data
def load_papers():
    papers = {}
    for f in sorted((ROOT / 'publications').glob('*/paper.json')):
        j = json.loads(f.read_text(encoding='utf-8'))
        papers[j['slug']] = j
    return papers


def people_and_places(src, lab, papers):
    places = src['places']
    aliases = src.get('aliases', {})
    pi_keys = name_keys(PI)
    parent = {}

    def find(k):
        while parent.setdefault(k, k) != k:
            parent[k] = parent[parent[k]]
            k = parent[k]
        return k

    def union(keys):
        keys = list(keys)
        for k in keys[1:]:
            parent[find(k)] = find(keys[0])

    for p in src['papers']:
        for a in p['authors']:
            a['name'] = aliases.get(a['name'], a['name'])
            union(name_keys(a['name']))
    for m in lab:
        union(name_keys(m['name']))

    def pid(name):
        return find(next(iter(name_keys(name))))

    lab_by_id = {pid(m['name']): m for m in lab}
    people = collections.defaultdict(lambda: {'names': collections.Counter(), 'slugs': [], 'affs': []})
    for order, p in enumerate(src['papers']):
        for a in p['authors']:
            if name_keys(a['name']) & pi_keys:
                continue
            x = people[pid(a['name'])]
            x['names'][a['name']] += 1
            if p['slug'] not in x['slugs']:
                x['slugs'].append(p['slug'])
            x['affs'].append((int(p.get('year') or 0), -order, a.get('affiliations') or []))

    placed = collections.defaultdict(lambda: collections.defaultdict(list))
    unplaced, everyone = [], {}
    for i, x in people.items():
        m = lab_by_id.get(i)
        name = TITLE_RE.sub('', m['name']) if m else max(x['names'], key=lambda n: (x['names'][n], len(n)))
        status = ('current' if (m.get('category_name') or '').lower() == 'current' else 'alumni') if m else ''
        person = {'name': name, 'papers': len(x['slugs']), 'slugs': x['slugs'], 'lab': status}
        everyone[i] = person
        where = None
        for _, _, affs in sorted(x['affs'], key=lambda t: (t[0], t[1]), reverse=True):     # most recent joint paper first
            where = next((f for f in affs if f.get('city') and f'{f["city"]}, {f["country"]}' in places), None)
            if where:
                break
        if where:
            placed[f'{where["city"]}, {where["country"]}'][where.get('institution') or 'No institution printed'].append(person)
        else:
            unplaced.append(person)

    out = []
    for key, insts in placed.items():
        city, country = key.rsplit(', ', 1)
        lat, lng = places[key]
        allp = [p for ps in insts.values() for p in ps]
        out.append({'key': key, 'city': city, 'country': country, 'lat': lat, 'lng': lng, 'hub': key in HUBS,
                    'people': len(allp), 'papers': len({s for p in allp for s in p['slugs']}),
                    'institutions': [{'name': n, 'people': sorted(ps, key=lambda p: (-p['papers'], p['name']))}
                                     for n, ps in sorted(insts.items(), key=lambda t: (-len(t[1]), t[0]))]})
    out.sort(key=lambda p: (-p['people'], -p['papers'], p['city']))
    for key in HUBS:
        if not any(p['key'] == key for p in out):
            city, country = key.rsplit(', ', 1)
            out.append({'key': key, 'city': city, 'country': country, 'lat': places[key][0], 'lng': places[key][1],
                        'hub': True, 'people': 0, 'papers': 0, 'institutions': []})
    return out, unplaced, everyone, lab_by_id, pid


def paper_order(src, papers):
    """Papers in the order they came out: year, then the best date we have (published, accepted, received)."""
    rows = []
    for p in src['papers']:
        j = papers.get(p['slug'], {})
        d = date(j.get('published')) or date(j.get('accepted')) or date(j.get('received'))
        y = int(p.get('year') or j.get('year') or 0)
        if d and d.year != y:
            d = None
        rows.append((y, d or dt.date(y, 12, 31), p['slug'], p.get('title') or j.get('title', '')))
    rows.sort()
    return [{'slug': s, 'year': y, 'title': t} for y, _, s, t in rows]


def main():
    src = read('data/coauthor-affiliations.json')
    journals = read('data/journals.json')
    lab_all = read('data/lab.json')['members']
    lab = [m for m in lab_all if norm(TITLE_RE.sub('', m['name'])) != norm(PI)]
    pubs = read('data/academic-publications.json')['publications']
    papers = load_papers()
    titles = {s: j.get('title', '') for s, j in papers.items()}

    # ---- map
    places, unplaced, everyone, lab_by_id, pid = people_and_places(src, lab, papers)
    order = paper_order(src, papers)
    for p in places:
        for inst in p['institutions']:
            inst['people'] = [{'name': q['name'], 'papers': q['papers'], 'lab': q['lab'], 'slugs': q['slugs']} for q in inst['people']]
    insts = {i['name'] for p in places for i in p['institutions']}
    totals = {'papers': len(src['papers']), 'coauthors': len(everyone), 'placed': len(everyone) - len(unplaced),
              'institutions': len(insts), 'places': sum(1 for p in places if p['people']),
              'countries': len({p['country'] for p in places if p['people']}),
              'abroad': sum(p['people'] for p in places if p['country'] != 'Israel'),
              'lab': sum(1 for x in everyone if x in lab_by_id)}
    map_data = {'hubs': [{'key': k, 'institution': v} for k, v in HUBS.items()], 'places': places, 'papers': order,
                'unplaced': sorted(({'name': p['name'], 'papers': p['papers'], 'slugs': p['slugs']} for p in unplaced), key=lambda p: p['name'])}

    # ---- topics per year
    topic_of = collections.Counter()
    by_year = collections.defaultdict(collections.Counter)
    for p in pubs:
        y = int(str(p.get('year') or 0)[:4] or 0)
        if y:
            by_year[y][p.get('topic') or 'Other'] += 1
            topic_of[p.get('topic') or 'Other'] += 1
    topics = [t for t in TOPIC_ORDER if topic_of[t]] + sorted(t for t in topic_of if t not in TOPIC_ORDER)
    years = list(range(min(by_year), max(by_year) + 1))
    topics_data = {'years': years, 'topics': [{'name': t, 'total': topic_of[t], 'counts': [by_year[y][t] for y in years]} for t in topics],
                   'totals': [sum(by_year[y].values()) for y in years]}

    # ---- journals, publishers, open access
    aliases = journals.get('aliases', {})
    jinfo = journals['journals']
    rows = []
    for s, j in papers.items():
        name = aliases.get((j.get('journal') or '').strip(), (j.get('journal') or '').strip())
        info = jinfo.get(name, {})
        cc = bool((j.get('license') or {}).get('url', '').startswith('https://creativecommons.org'))
        rows.append({'slug': s, 'title': j.get('title', ''), 'year': int(j.get('year') or 0), 'journal': name,
                     'publisher': info.get('publisher') or 'Other', 'oa': cc or info.get('fully_open_access') is True,
                     'quartile': info.get('sjr_quartile'), 'type': j.get('pub_type') or 'Paper',
                     'authors': len(j.get('authors') or []),
                     'received': j.get('received') or '', 'accepted': j.get('accepted') or '', 'published': j.get('published') or ''})
    jcount = collections.Counter(r['journal'] for r in rows)
    pcount = collections.Counter(r['publisher'] for r in rows)
    known_q = [r for r in rows if r['quartile']]
    venues = {'journals': [{'name': n, 'papers': c, 'publisher': jinfo.get(n, {}).get('publisher') or 'Other',
                            'open': sum(1 for r in rows if r['journal'] == n and r['oa']), 'quartile': jinfo.get(n, {}).get('sjr_quartile')}
                           for n, c in sorted(jcount.items(), key=lambda t: (-t[1], t[0].lower()))],
              'publishers': [{'name': n, 'papers': c} for n, c in sorted(pcount.items(), key=lambda t: (-t[1], t[0]))],
              'open': sum(1 for r in rows if r['oa']), 'total': len(rows), 'journalCount': len(jcount),
              'q1': {'known': len(known_q), 'q1': sum(1 for r in known_q if r['quartile'] == 'Q1')} if known_q else None,
              'openByYear': [{'year': y, 'open': sum(1 for r in rows if r['year'] == y and r['oa']), 'total': sum(1 for r in rows if r['year'] == y)} for y in years]}

    # ---- the review race
    race = []
    for r in rows:
        a, b, c = date(r['received']), date(r['accepted']), date(r['published'])
        review = (b - a).days if a and b and 0 <= (b - a).days <= 1500 else None
        prod = (c - b).days if b and c and 0 <= (c - b).days <= 730 else None
        if review is not None or prod is not None:
            race.append({'slug': r['slug'], 'title': r['title'], 'journal': r['journal'], 'publisher': r['publisher'], 'year': r['year'],
                         'review': review, 'production': prod})
    by_pub = collections.defaultdict(list)
    for x in race:
        by_pub[x['publisher']].append(x)
    pubs_race = []
    for n, xs in by_pub.items():
        rv = [x['review'] for x in xs if x['review'] is not None]
        pr = [x['production'] for x in xs if x['production'] is not None]
        if len(rv) >= 3:
            pubs_race.append({'name': n, 'papers': len(xs), 'reviewN': len(rv), 'review': median(rv), 'productionN': len(pr),
                              'production': median(pr), 'journals': sorted({x['journal'] for x in xs})})
    pubs_race.sort(key=lambda p: (p['review'] + (p['production'] or 0)))
    rv_all = [x for x in race if x['review'] is not None]
    pr_all = [x['production'] for x in race if x['production'] is not None]
    fastest = min(rv_all, key=lambda x: x['review']) if rv_all else None
    slowest = max(rv_all, key=lambda x: x['review']) if rv_all else None
    review = {'papers': race, 'publishers': pubs_race, 'reviewN': len(rv_all), 'productionN': len(pr_all),
              'review': median([x['review'] for x in rv_all]), 'production': median(pr_all),
              'within100': sum(1 for x in rv_all if x['review'] <= 100), 'fastest': fastest, 'slowest': slowest}

    # ---- the lab over time
    today = dt.date.today().strftime('%Y-%m')
    members = []
    for m in lab:
        title = m.get('title') or ''
        group = next((g for g, keys in ROLE_GROUPS if any(k in title.lower() for k in keys)), ROLE_GROUPS[-1][0])
        person = everyone.get(pid(m['name']))
        slugs = person['slugs'] if person else []
        dated = sorted((papers.get(s, {}).get('year') or 9999, s) for s in slugs)
        first = {'year': dated[0][0], 'slug': dated[0][1], 'title': titles.get(dated[0][1], '')} if dated else None
        start, end = dmy(m.get('s_date')), dmy(m.get('e_date'))
        current = (m.get('category_name') or '').lower() == 'current'
        members.append({'name': TITLE_RE.sub('', m['name']), 'title': title, 'group': group, 'start': start,
                        'end': None if current else (end or start), 'current': current, 'papers': len(slugs), 'first': first,
                        'photo': m.get('image_link') or ''})
    members.sort(key=lambda x: (x['start'] or '9999', x['name']))
    lab_data = {'members': members, 'groups': [g for g, _ in ROLE_GROUPS], 'today': today,
                'current': sum(1 for x in members if x['current']), 'alumni': sum(1 for x in members if not x['current']),
                'withPapers': sum(1 for x in members if x['papers'])}

    # ---- team size
    team_rows = [{'slug': r['slug'], 'title': r['title'], 'year': r['year'], 'authors': r['authors'], 'journal': r['journal']}
                 for r in rows if r['authors'] and r['year']]
    team_years = []
    for y in years:
        xs = [r['authors'] for r in team_rows if r['year'] == y]
        if xs:
            team_years.append({'year': y, 'papers': len(xs), 'median': median(xs), 'max': max(xs), 'mean': round(sum(xs) / len(xs), 1)})
    biggest = max(team_rows, key=lambda r: r['authors'])
    team = {'papers': sorted(team_rows, key=lambda r: (r['year'], r['authors'])), 'years': team_years, 'biggest': biggest,
            'median': median([r['authors'] for r in team_rows]), 'duos': sum(1 for r in team_rows if r['authors'] == 2),
            'solo': sum(1 for r in team_rows if r['authors'] == 1)}

    data = {'updated': dt.date.today().isoformat(), 'totals': totals, 'map': map_data, 'topics': topics_data,
            'review': review, 'venues': venues, 'lab': lab_data, 'team': team}

    # the collaboration map on team.html reads the same map data from a small script, loaded when the section is near
    collab = {'updated': data['updated'], 'totals': totals, 'map': map_data}
    (ROOT / 'data' / 'collab-map.js').write_text(
        '/* Made by tools/build_statistics.py: data for the collaboration map on team.html (read by js/coauthor-map.js). */\n'
        'window.ACML_COLLAB = ' + json.dumps(collab, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')

    # ---------------------------------------------------------------- write the page
    text = PAGE.read_text(encoding='utf-8')
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    text = replace_block(text, 'stats data', f'      <script type="application/json" id="stats-data">{blob}</script>')
    tiles = [(totals['coauthors'], 'co-authors'), (totals['institutions'], 'institutions'), (totals['places'], 'cities'),
             (totals['countries'], 'countries'), (totals['papers'], 'papers'), (venues['journalCount'], 'journals')]
    text = replace_block(text, 'stats numbers', '\n'.join(
        f'          <div class="stat"><strong>{n}</strong><span>{esc(label)}</span></div>' for n, label in tiles))

    # map table
    rows_html = []
    for p in places:
        if not p['people']:
            continue
        inst = '; '.join(f'{i["name"]} ({len(i["people"])})' for i in p['institutions'])
        names = ', '.join(f'{q["name"]} ({q["papers"]})' for i in p['institutions'] for q in i['people'])
        rows_html.append(f'<th scope="row">{esc(p["city"])}<small>{esc(p["country"])}</small></th><td>{esc(inst)}</td>'
                         f'<td class="num">{p["people"]}</td><td class="num">{p["papers"]}</td><td class="names">{esc(names)}</td>')
    text = replace_block(text, 'stats map table', table(['Place', 'Institutions (co-authors)', '#Co-authors', '#Joint papers', 'Co-authors (joint papers)'], rows_html))

    # topics table
    head = ['Year'] + ['#' + t['name'] for t in topics_data['topics']] + ['#All']
    rows_html = [f'<th scope="row">{y}</th>' + ''.join(f'<td class="num">{t["counts"][k]}</td>' for t in topics_data['topics']) +
                 f'<td class="num"><b>{topics_data["totals"][k]}</b></td>' for k, y in enumerate(years)]
    text = replace_block(text, 'stats topics table', table(head, rows_html))

    # review table
    rows_html = [f'<th scope="row">{esc(p["name"])}<small>{esc(", ".join(p["journals"][:4]))}{" and more" if len(p["journals"]) > 4 else ""}</small></th>'
                 f'<td class="num">{p["reviewN"]}</td><td class="num">{p["review"]:g}</td>'
                 f'<td class="num">{"" if p["production"] is None else format(p["production"], "g")}</td><td class="num">{p["productionN"]}</td>'
                 for p in review['publishers']]
    text = replace_block(text, 'stats review table', table(
        ['Publisher', '#Papers with dates', '#Median days to acceptance', '#Median days from acceptance to publication', '#Papers with a publication date'], rows_html))

    # venues table
    rows_html = [f'<th scope="row">{esc(j["name"])}</th><td>{esc(j["publisher"])}</td><td class="num">{j["papers"]}</td>'
                 f'<td class="num">{j["open"]}</td><td>{esc(j["quartile"] or "")}</td>' for j in venues['journals']]
    text = replace_block(text, 'stats venues table', table(['Journal', 'Publisher', '#Papers', '#Open access', 'SCImago quartile'], rows_html))

    # lab table
    rows_html = []
    for x in members:
        when = f'{month_label(x["start"])} – {"now" if x["current"] else month_label(x["end"])}'
        first = f'{paper_link(x["first"]["slug"], x["first"]["title"])} ({x["first"]["year"]})' if x['first'] else ''
        rows_html.append(f'<th scope="row">{esc(x["name"])}</th><td>{esc(x["title"])}</td><td>{esc(when)}</td>'
                         f'<td class="num">{x["papers"]}</td><td>{first}</td>')
    text = replace_block(text, 'stats lab table', table(['Lab member', 'Role', 'In the lab', '#Joint papers', 'First joint paper'], rows_html))

    # team table
    rows_html = [f'<th scope="row">{t["year"]}</th><td class="num">{t["papers"]}</td><td class="num">{t["median"]:g}</td>'
                 f'<td class="num">{t["mean"]:g}</td><td class="num">{t["max"]}</td>' for t in team_years]
    text = replace_block(text, 'stats team table', table(['Year', '#Papers', '#Median authors', '#Mean authors', '#Largest team'], rows_html))

    # the one-line takeaways
    def lead(name, sentence):
        return replace_block(text, f'stats {name} lead', f'          <p class="st-lead">{sentence}</p>')

    first_y = next(y for k, y in enumerate(years) if topics_data['totals'][k])
    share = {t['name']: round(100 * t['total'] / sum(topics_data['totals'])) for t in topics_data['topics']}
    peak = max(range(len(years)), key=lambda k: topics_data['totals'][k])
    n0 = topics_data['totals'][years.index(first_y)]
    so_far = ' so far' if years[peak] == dt.date.today().year else ''
    text = lead('topics', f'From {n0} paper{"" if n0 == 1 else "s"} in {first_y} to {topics_data["totals"][peak]} in {years[peak]}{so_far}. '
                          f'Machine learning is {share.get("Machine Learning", 0)}% of everything we published, with biomathematics '
                          f'({share.get("Biomathematics", 0)}%) and epidemiology ({share.get("Epidemiology", 0)}%) next.')
    text = lead('review', f'Half of our papers were accepted within {review["review"]:g} days of submission, and {review["within100"]} of '
                          f'{review["reviewN"]} within 100 days. Once accepted, a paper went online after a median of {review["production"]:g} days.')
    top = venues['journals'][0]
    text = lead('venues', f'{venues["total"]} papers in {venues["journalCount"]} journals. {esc(top["name"])} leads with {top["papers"]} papers, and '
                          f'{venues["open"]} papers ({round(100 * venues["open"] / venues["total"])}%) are open access.')
    text = lead('lab', f'{len(members)} people have been part of the lab: {lab_data["current"]} are here now and {lab_data["alumni"]} have moved on. '
                       f'{lab_data["withPapers"]} of them have already co-written a paper with us.')
    text = lead('team', f'Our median paper has {team["median"]:g} authors and {team["duos"]} were written by two people. The largest team had '
                        f'{biggest["authors"]} authors, on {paper_link(biggest["slug"], biggest["title"])}.')

    PAGE.write_text(text, encoding='utf-8')
    missing_q = sum(1 for j in jinfo.values() if not j.get('sjr_quartile'))
    print(f'{totals["coauthors"]} co-authors in {totals["places"]} cities and {totals["countries"]} countries; {len(rows)} papers in '
          f'{venues["journalCount"]} journals ({venues["open"]} open access); review times for {review["reviewN"]} papers; '
          f'{len(members)} lab members. {missing_q} journals have no SCImago quartile yet. statistics-demo.html updated.')


if __name__ == '__main__':
    main()
