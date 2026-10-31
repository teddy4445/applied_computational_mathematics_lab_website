#!/usr/bin/env python3
"""Bring the collaboration map on team.html up to date with the latest papers, with no LLM and no hand work.

    python tools/update_collab_map.py              add every new paper, then rebuild the map
    python tools/update_collab_map.py --dry-run    show what would be added, change nothing
    python tools/update_collab_map.py --redo-auto  look up again every paper this script added before
    python tools/update_collab_map.py --redo SLUG  look up one paper again (also one added by hand)
    python tools/update_collab_map.py --prune      also drop papers whose publications/<slug>/ folder is gone
    python tools/update_collab_map.py --offline    use only answers already in tools/.cache/ (no internet)

What it does
  1. Finds the papers that have a page (publications/<slug>/paper.json) but no entry in data/coauthor-affiliations.json.
  2. Looks each one up by its DOI in OpenAlex (free, no key), which links every author to an institution
     and gives the institution's city and coordinates. Crossref is used as a second source.
  3. Places each author, in this order:
       a. an institution we already have in data/coauthor-affiliations.json (same name, so the map keeps one
          spelling and one city per institution, e.g. Bar-Ilan University -> Ramat Gan);
       b. the institution's city and coordinates from OpenAlex (a new city is added to "places");
       c. an institution we already know that is named in the author's printed affiliation text;
       d. the affiliation this person had on our most recent paper together.
     Authors that none of these place are left without an affiliation and the map lists them as unplaced.
  4. Appends the new papers to data/coauthor-affiliations.json, marked "source": "openalex" and
     "confidence": "auto", and runs tools/build_statistics.py, which rewrites data/collab-map.js
     (read by team.html) and statistics-demo.html.

Entries already in data/coauthor-affiliations.json are never changed (unless you ask with --redo / --redo-auto),
so hand fixes there are safe. To correct an automatic entry, edit it and set "confidence" to "high" so
--redo-auto leaves it alone. To map an OpenAlex institution name onto the spelling the site uses, add it to
"institution_aliases" in data/coauthor-affiliations.json, e.g. "Technion-Israel Institute of Technology":
"Technion – Israel Institute of Technology".

Only the Python standard library is needed. Optional: set the ACML_MAILTO environment variable to an e-mail
address to be served from the OpenAlex / Crossref "polite pool". Answers from OpenAlex / Crossref are kept in tools/.cache/ so a
second run is fast and works offline.
"""
import argparse
import collections
import datetime as dt
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data' / 'coauthor-affiliations.json'
CACHE = ROOT / 'tools' / '.cache'
PI = 'Teddy Lazebnik'
MAILTO = os.environ.get('ACML_MAILTO', '')  # optional: set it to an e-mail to use the OpenAlex / Crossref "polite pool"
UA = 'ACML-site-collab-map/1.0 (https://acml.teddylazebnik.com' + (f'; mailto:{MAILTO})' if MAILTO else ')')
POLITE = f'mailto={urllib.parse.quote(MAILTO)}' if MAILTO else ''
GENERIC = {'university', 'college', 'institute', 'school', 'department', 'faculty', 'center', 'centre', 'hospital',
           'medical', 'the', 'of', 'and', 'for', 'research', 'sciences', 'science', 'technology', 'health'}

# OpenAlex country names that differ from the ones the site uses
COUNTRY_FIX = {'United States of America': 'United States', 'Czechia': 'Czech Republic', 'Türkiye': 'Turkey',
               'Korea, Republic of': 'South Korea', 'Russian Federation': 'Russia', 'Viet Nam': 'Vietnam'}


# ---------------------------------------------------------------- small helpers
def norm(s):
    s = unicodedata.normalize('NFKD', s or '')
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if not unicodedata.combining(c)).lower())


def words(s):
    s = unicodedata.normalize('NFKD', s or '')
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    return [w for w in re.split(r'[^a-z0-9]+', s) if w]


def inst_key(name):
    """'The Ohio State University' = 'Ohio State University'; 'Technion-Israel Inst.' = 'Technion – Israel Inst.'"""
    return ''.join(w for w in words(name) if w != 'the')


def family(name):
    parts = [p for p in re.split(r'\s+', (name or '').strip()) if norm(p)]
    return norm(parts[-1]) if parts else ''


def log(msg):
    print(msg, flush=True)


# ---------------------------------------------------------------- web, with a cache on disk
class Web:
    def __init__(self, offline=False):
        self.offline = offline
        self.missing = []
        CACHE.mkdir(parents=True, exist_ok=True)

    def get(self, url):
        f = CACHE / (hashlib.sha1(url.encode()).hexdigest()[:16] + '.json')
        if f.exists():
            return json.loads(f.read_text(encoding='utf-8'))
        if self.offline:
            self.missing.append(url)
            return None
        for attempt in range(4):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
                with urllib.request.urlopen(req, timeout=30) as r:
                    data = json.loads(r.read().decode('utf-8'))
                f.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
                time.sleep(0.15)
                return data
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    f.write_text('null', encoding='utf-8')     # remember "not there" too
                    return None
                if e.code in (429, 500, 502, 503, 504) and attempt < 3:
                    time.sleep(2 ** attempt)
                    continue
                log(f'  ! {url}: HTTP {e.code}')
                return None
            except (urllib.error.URLError, TimeoutError, OSError) as e:
                if attempt < 3:
                    time.sleep(2 ** attempt)
                    continue
                log(f'  ! {url}: {e}')
                return None


def openalex_work(web, doi):
    return web.get(f'https://api.openalex.org/works/doi:{urllib.parse.quote(doi.lower(), safe="/.")}'
                   '?select=id,doi,title,authorships' + (f'&{POLITE}' if POLITE else ''))


def openalex_institution(web, iid):
    iid = iid.rsplit('/', 1)[-1]
    return web.get(f'https://api.openalex.org/institutions/{iid}?select=id,display_name,country_code,geo' + (f'&{POLITE}' if POLITE else ''))


def crossref_work(web, doi):
    d = web.get(f'https://api.crossref.org/works/{urllib.parse.quote(doi, safe="/.")}' + (f'?{POLITE}' if POLITE else ''))
    return (d or {}).get('message') if isinstance(d, dict) else None


# ---------------------------------------------------------------- what we already know
class Gazetteer:
    """Every institution already on the map, with its city, so new papers reuse the same spelling and place."""

    def __init__(self, src):
        self.places = src['places']
        self.aliases = {inst_key(k): v for k, v in (src.get('institution_aliases') or {}).items()}
        seen = collections.defaultdict(collections.Counter)
        self.person = {}                            # family|first -> (year, affiliations) of their latest paper
        for p in src['papers']:
            for a in p['authors']:
                affs = [f for f in a.get('affiliations') or [] if f.get('city')]
                for f in affs:
                    if f.get('institution') and f['institution'] != 'No institution printed':
                        seen[f['institution']][(f['city'], f['country'])] += 1
                if affs:
                    k = self.pkey(a['name'])
                    if k not in self.person or int(p.get('year') or 0) >= self.person[k][0]:
                        self.person[k] = (int(p.get('year') or 0), affs)
        self.known, self.cities = {}, {}
        for name, cities in seen.items():
            city, country = cities.most_common(1)[0][0]
            self.known[inst_key(name)] = {'institution': name, 'city': city, 'country': country}
            self.cities[inst_key(name)] = [c for c, _ in cities.most_common()]
        # for "is this known institution named inside the printed affiliation?" - longest names first
        self.by_length = sorted(self.known.values(), key=lambda x: -len(inst_key(x['institution'])))

    @staticmethod
    def pkey(name):
        parts = [norm(p) for p in re.split(r'[\s\-]+', name or '') if len(norm(p)) > 1]
        return f'{parts[0]}|{parts[-1]}' if len(parts) >= 2 else norm(name)

    def lookup(self, name, text=''):
        """A known institution; when we know it in more than one city, the one named in the printed text wins."""
        k = inst_key(self.aliases.get(inst_key(name), name))
        if k not in self.known:
            return None
        hit = dict(self.known[k])
        t = norm(text)
        for city, country in self.cities.get(k, []):
            if t and norm(city) in t:
                hit.update(city=city, country=country)
                break
        return hit

    def in_text(self, text):
        """A known institution whose full name appears in a printed affiliation line."""
        t = inst_key(text)
        for x in self.by_length:
            k = inst_key(x['institution'])
            if len(k) >= 8 and k in t and set(words(x['institution'])) - GENERIC:
                return dict(x)
        for alias, target in self.aliases.items():
            if len(alias) >= 8 and alias in t and inst_key(target) in self.known:
                return dict(self.known[inst_key(target)])
        return None

    def add_place(self, city, country, lat, lng):
        key = f'{city}, {country}'
        if key not in self.places and lat is not None and lng is not None:
            self.places[key] = [round(float(lat), 4), round(float(lng), 4)]
            return key
        return None


# ---------------------------------------------------------------- one paper
def match_authorships(authors, ships):
    """Pair each author of paper.json with an OpenAlex authorship: same family name, else same position."""
    out, used = [], set()
    for i, a in enumerate(authors):
        fam = norm(a.get('family') or '') or family(a['name'])
        hit = None
        for j, s in enumerate(ships):
            if j in used:
                continue
            on = (s.get('author') or {}).get('display_name') or s.get('raw_author_name') or ''
            if fam and (fam == family(on) or fam in norm(on)):
                hit = j
                break
        if hit is None and len(authors) == len(ships) and i not in used:
            hit = i
        if hit is not None:
            used.add(hit)
        out.append(ships[hit] if hit is not None else None)
    return out


def crossref_affs(cr, authors):
    """Crossref affiliation names per author (often empty, but useful when OpenAlex has none)."""
    res = [[] for _ in authors]
    if not cr:
        return res
    cra = cr.get('author') or []
    for i, a in enumerate(authors):
        fam = norm(a.get('family') or '') or family(a['name'])
        for c in cra:
            if fam and norm(c.get('family') or '') == fam:
                res[i] = [x.get('name', '') for x in c.get('affiliation') or [] if x.get('name')]
                break
    return res


def place_author(a, ship, cr_names, gaz, web, new_places):
    affs, how = [], ''
    if ship:
        for inst in ship.get('institutions') or []:
            name = inst.get('display_name') or ''
            raw = '; '.join(ship.get('raw_affiliation_strings') or [])
            known = gaz.lookup(name, raw)
            if known:
                affs.append({**known, 'raw': raw or name})
                how = how or 'known institution'
                continue
            info = openalex_institution(web, inst['id']) if inst.get('id') else None
            geo = (info or {}).get('geo') or {}
            if geo.get('city') and geo.get('country'):
                country = COUNTRY_FIX.get(geo['country'], geo['country'])
                added = gaz.add_place(geo['city'], country, geo.get('latitude'), geo.get('longitude'))
                if added:
                    new_places.append(added)
                site_name = (gaz.aliases.get(inst_key(name)) or name)
                affs.append({'institution': site_name, 'city': geo['city'], 'country': country, 'raw': raw or name})
                gaz.known.setdefault(inst_key(site_name), {'institution': site_name, 'city': geo['city'], 'country': country})
                how = how or 'OpenAlex'
        if not affs:
            for raw in ship.get('raw_affiliation_strings') or []:
                known = gaz.in_text(raw)
                if known:
                    affs.append({**known, 'raw': raw})
                    how = 'printed affiliation'
                    break
    if not affs:
        for raw in cr_names:
            known = gaz.in_text(raw) or gaz.lookup(raw, raw)
            if known:
                affs.append({**known, 'raw': raw})
                how = 'Crossref'
                break
    if not affs:
        prev = gaz.person.get(gaz.pkey(a['name']))
        if prev:
            affs = [dict(f, raw=f'(as on our {prev[0]} paper) ' + (f.get('raw') or '')) for f in prev[1]]
            how = 'earlier paper'
    # one entry per institution, in the order given
    seen, uniq = set(), []
    for f in affs:
        k = inst_key(f['institution'])
        if k not in seen:
            seen.add(k)
            uniq.append(f)
    return uniq, how


def build_entry(slug, meta, gaz, web, new_places):
    doi = (meta.get('doi') or '').strip()
    doi = re.sub(r'^(https?://(dx\.)?doi\.org/|doi:)', '', doi, flags=re.I)
    authors = [a for a in meta.get('authors') or [] if a.get('name')]
    work = openalex_work(web, doi) if doi else None
    ships = (work or {}).get('authorships') or []
    paired = match_authorships(authors, ships) if ships else [None] * len(authors)
    cr_names = crossref_affs(crossref_work(web, doi) if doi else None, authors)
    out, notes = [], []
    for a, ship, crn in zip(authors, paired, cr_names):
        affs, how = place_author(a, ship, crn, gaz, web, new_places)
        out.append({'name': a['name'], 'confidence': 'auto', 'affiliations': affs})
        notes.append(f'{a["name"]}: ' + (f'{affs[0]["institution"]}, {affs[0]["city"]} ({how})' if affs else 'not placed'))
    entry = {'slug': slug, 'year': int(meta.get('year') or 0), 'title': meta.get('title', ''), 'source': 'openalex',
             'doi': doi, 'authors': out}
    return entry, notes, bool(work)


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--dry-run', action='store_true', help='show what would change, write nothing')
    ap.add_argument('--redo-auto', action='store_true', help='look up again every paper added by this script')
    ap.add_argument('--redo', action='append', default=[], metavar='SLUG', help='look up this paper again')
    ap.add_argument('--prune', action='store_true', help='drop papers whose publications/<slug>/ folder is gone')
    ap.add_argument('--offline', action='store_true', help='use only cached answers in tools/.cache/')
    ap.add_argument('--no-build', action='store_true', help='do not run tools/build_statistics.py afterwards')
    args = ap.parse_args()

    src = json.loads(SRC.read_text(encoding='utf-8-sig'))
    pages = {}
    for f in sorted((ROOT / 'publications').glob('*/paper.json')):
        meta = json.loads(f.read_text(encoding='utf-8-sig'))
        pages[meta.get('slug') or f.parent.name] = meta

    redo = set(args.redo)
    if args.redo_auto:
        redo |= {p['slug'] for p in src['papers']
                 if p.get('source') == 'openalex' and all(a.get('confidence') == 'auto' for a in p['authors'])}
    unknown = redo - set(pages)
    if unknown:
        log(f'! no publications/<slug>/paper.json for: {", ".join(sorted(unknown))}')
    keep = [p for p in src['papers'] if p['slug'] not in redo]
    gone = [p['slug'] for p in keep if p['slug'] not in pages]
    if args.prune and gone:
        keep = [p for p in keep if p['slug'] in pages]
    src['papers'] = keep

    have = {p['slug'] for p in src['papers']}
    todo = sorted(s for s in pages if s not in have)
    if not todo and not (args.prune and gone):
        log(f'The map data already has all {len(pages)} papers.')
        if gone:
            log(f'  ({len(gone)} entries have no page any more: {", ".join(gone)}; run with --prune to drop them)')
    gaz = Gazetteer(src)
    web = Web(offline=args.offline)
    new_places, added, no_doi, not_found = [], [], [], []
    for slug in todo:
        meta = pages[slug]
        if not (meta.get('doi') or '').strip():
            no_doi.append(slug)
        entry, notes, found = build_entry(slug, meta, gaz, web, new_places)
        if (meta.get('doi') or '').strip() and not found and not args.offline:
            not_found.append(slug)
        added.append(entry)
        log(f'+ {slug} ({entry["year"]})')
        for n in notes:
            log(f'    {n}')

    if web.missing:
        log('\nOffline, and these answers are not in tools/.cache/ yet (run once with internet):')
        for u in web.missing:
            log('  ' + u)

    if no_doi:
        log(f'\n! No DOI in paper.json, so only earlier-paper matches were used: {", ".join(no_doi)}')
    if not_found:
        log(f'! Not found in OpenAlex yet (very new papers can take a few weeks): {", ".join(not_found)}.'
            ' Run again later with --redo-auto, or fix them by hand.')
    if new_places:
        log(f'New cities on the map: {", ".join(new_places)}')
    if args.prune and gone:
        log(f'Dropped (no page any more): {", ".join(gone)}')

    if args.dry_run:
        log('\nDry run: nothing written.')
        return
    if not added and not (args.prune and gone):
        if not args.no_build:
            run_build()
        return

    src['papers'].extend(added)
    src['places'] = dict(sorted(src['places'].items(), key=lambda kv: (kv[0].rsplit(', ', 1)[1], kv[0])))
    src['updated'] = dt.date.today().isoformat()
    src.setdefault('institution_aliases', {})
    src['_readme'] = re.sub(r'tools/build_coauthor_map\.py turns this file into the collaboration map on statistics-demo\.html\. '
                            r'When a new paper is added, add its authors here \(and any new city to "places"\) and run the script again\.',
                            'tools/update_collab_map.py adds new papers here automatically (from OpenAlex, marked "source": '
                            '"openalex", "confidence": "auto") and tools/build_statistics.py turns this file into the collaboration '
                            'map on team.html. Hand edits are kept; set "confidence" to "high" on an entry you corrected.',
                            src['_readme'])
    SRC.write_text(json.dumps(src, ensure_ascii=False, indent=1), encoding='utf-8')
    log(f'\ndata/coauthor-affiliations.json: {len(added)} papers added, {len(src["papers"])} in all.')
    if not args.no_build:
        run_build()


def run_build():
    sys.path.insert(0, str(ROOT / 'tools'))
    import build_statistics
    build_statistics.main()


if __name__ == '__main__':
    main()
