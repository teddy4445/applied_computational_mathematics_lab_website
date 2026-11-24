# applied_computational_mathematics_lab_website
The website for the applied computational mathematics lab of Prof Teddy Lazebnik

## Publication SEO pages

Publication cards now point to static SEO-friendly pages generated under `publications/<paper-slug>/`:

- `index.html`: overview with title, authors, abstract, and infographic
- `paper.html`: HTML paper page for full-text sections, figures, tables, and citations
- `simple.html`: friendly explanation page for a broader audience
- `video.html`: video page with abstract and optional YouTube embed

## Styles (Tailwind CSS)

The pages no longer load the Tailwind CDN script. They use two pre-built files:

- `css/tailwind.css`: the lab theme (blue `primary`, rose `secondary`, rounder corners). Used by every page that loads `js/main.js`, and by `404.html`.
- `css/tailwind-default.css`: Tailwind's default theme. Used by `sock.html`, which never loaded the lab theme.

After adding or changing Tailwind classes in any page, script or data file, rebuild both files (needs Node.js):

```
npm install
npm run build:css
```

The theme lives in `tailwind.config.js`.

## Paper pages

Every paper has its own page at `publications/<slug>/` with the full text, figures, tables, equations and references, a short "at a glance" summary, and the tags Google Scholar reads. The Publications list links a paper's title (and shows "Read online") when its page exists. The PDF is not copied into the folder: the page links to the original at `https://teddylazebnik.com/files/<name>.pdf`.

One folder per paper, `publications/<slug>/`:

- `paper.md`: the full text (Markdown, with HTML for figures and tables). Fix anything the PDF extraction got wrong here.
- `paper.json`: title, authors, journal, dates, DOI, licence, abstract, keywords, and the summary fields (`summary`, `key_findings`, `key_numbers`, `short_title`, `featured_figure`, `related_project`). The extractor never overwrites the summary fields, and `"reviewed": true` stops it from overwriting the rest.
- `figures/`: figures, equations, and the tables that are kept as images (WebP).
- `index.html`: made by the build script. Don't edit it.

Papers whose PDF is not in the files folder get a short page with the abstract. A conference version of a journal paper gets a short page that points to the journal version.

Add a new paper:

1. `pip install -r tools/requirements.txt` (once).
2. Add the paper to `data/academic-publications.json` as usual, with its PDF in `teddy_lazebnik_academic_website/files/`.
3. `python tools/paper_extract.py all --only-new` (or `python tools/paper_extract.py <name>.pdf` for one paper). The PDFs are read from `../teddy_lazebnik_academic_website/files`; add `--pdf-dir <folder>` if they are somewhere else.
4. Check `paper.md` against the PDF, write the summary fields in `paper.json`, and set `"reviewed": true`.
5. `python tools/build_papers.py`. This builds every paper page (including the "Related research" links) and updates `data/paper-pages.json`, `sitemap.xml` and `llms.txt`.

`python tools/paper_extract.py all` extracts every paper again (reviewed papers are skipped unless you add `--force`). Each `paper.json` has an `extracted` block with the number of figures, tables and references found and a `check` list of things worth a look.

What else the pages do:

- **Full-text search.** The Publications page has a search box over the full text of every paper ([Pagefind](https://pagefind.app); the index is in `pagefind/`). A result opens the paper at the matching section with the words highlighted. `python tools/build_papers.py` rebuilds the index when Pagefind is installed (`npm install` once); otherwise run `npm run build:search` after it. Each paper page also has a small "Search all our papers" box.
- **Reference previews.** Hovering over (or tapping) a citation, numbered or author-year, shows the reference (`js/paper-page.js`).
- **Videos.** A video in `data/videos.json` whose `paper.title` matches the paper's title is shown under the abstract.
- **Research project.** A paper listed in a project's `papers` in `data/projects-info.json` links to that project's page under "Related research".
- **Search engines and AI tools.** `sitemap.xml` lists every paper page with its figures, and `llms.txt` lists every paper with authors, journal, DOI, a short summary and a link to its full text as Markdown (`paper.md`).

The site has a `.nojekyll` file so that GitHub Pages publishes the files as they are. Keep it: without it GitHub runs Jekyll, which tries to render every `paper.md` and fails.

## Project pages

Every research project has its own page at `projects/<slug>/` (plain HTML, so search engines read it in full). A page has an overview, methods and outcomes, selected findings from the latest papers, all the project's papers by year (with a filter box and a papers-per-year chart, each linked to its paper page), the team (current members, past members, collaborators and frequent co-authors: researchers outside the lab with three or more of the project's papers, set by `FREQUENT` in `tools/build_projects.py`), a timeline, videos, media coverage, tools and related projects. The project list on `projects.html` is made from the same data; the numbers at its top (projects, papers, lab members) are recounted from the data files each time the page loads (`js/projects-stats.js`), and the built numbers are only a fallback. `project.html` only forwards old `project.html?pagename=<slug>` links to the new pages.

Everything comes from `data/projects-info.json`:

- the text: `title`, `subtitle`, `summary`, `description`, `methods`, `outcomes`, `timeline`, `tags`, `category`, `status` (`ongoing` or `completed`), `period`, `image`;
- `papers`: the paper-page folders in `publications/` that belong to the project (a paper can be in more than one project). `papers_label` and `papers_note` change the heading, for example "Related publications" for earlier papers a project builds on;
- `team`: lab members by name, as in `data/lab.json` (photo, title, dates and current/past status come from there; `focus` is their part in this project), and collaborators with `"role": "Collaborator"`, an `avatar` and `links`;
- `videos` (YouTube ids from `data/videos.json`), `media` (links from `data/media.json`) and `tools` (page names, from `data/tools.json` or the page itself).

After changing any of these (or `data/lab.json`, or after adding papers), run:

```
python tools/build_projects.py
```

It writes `projects/<slug>/index.html` and a social image `projects/<slug>/share.jpg`, and updates the project list on `projects.html`, `sitemap.xml` and `llms.txt`. Run it after `python tools/build_papers.py` when both changed.

## Video pages (watch/) and Google video results

Every video in `data/videos.json` has its own page at `watch/<slug>/`: the player at the top, the summary, the paper it is based on, episode links for the series, and related videos. Google shows a page in its video results only when the video is the main content of that page, so these pages (not the Videos page or the paper pages) carry the VideoObject structured data. Each entry in `data/videos.json` needs two extra fields for this: `published` (when the video went public on YouTube, as an ISO time in UTC, or the `YYYY-MM-DD` date it is scheduled for) and `duration` (`m:ss`). After adding or changing videos, run:

```
python tools/build_watch_pages.py
```

It writes the pages, `data/watch-pages.json` (read by `js/videos.js` to link every card on the Videos page to its page), `sitemap-videos.xml` (listed in `robots.txt`), and a link preview per page. A video that is still scheduled gets its page with a "coming on <date>" card; from its release day on, `js/watch.js` shows the player and adds the structured data in the browser, so nothing has to be rebuilt on the day (running the script again after release makes it static). Page addresses are kept in `data/watch-pages.json`, so they don't change when a title does. Submit `sitemap-videos.xml` in Google Search Console and watch its "Videos" report.

## Link previews (share images)

When a page is shared on LinkedIn, X, WhatsApp or Slack, the preview shows a 1200x630 card with the ACML logo, what the page is, its title and a picture: the featured figure for a paper, the project image for a project, a play button for a video, and the lab's mark for other pages. The cards are drawn by `tools/share_cards.py` (fonts in `tools/fonts`, Inter, SIL Open Font License). `build_papers.py`, `build_projects.py` and `build_watch_pages.py` draw the cards of their pages; for the hand-made pages (home, team, projects list, publications, videos, tools, media, statistics, the tools and games, and the RL course) run:

```
python tools/build_share_cards.py
```

It draws `img/share/*.jpg` (and the RL course's `share.jpg` files) from each page's own title and description, and points the page's `og:image` and `twitter:image` at them. Add a new hand-made page to `PAGES` in that script. Change `VERSION` in `share_cards.py` (or edit the file) to have the builders redraw every card.

## Reinforcement learning course (rl-course/)

Teddy's RL course has its own pages: `rl-course/` (the course page: how to study, all lectures, labs and games) and one page per lecture, `rl-course/lecture-01/` … `rl-course/lecture-12/`. A lecture page opens with its title, summary, learning goal, one key idea per episode and the source lecture, next to the first slide of the deck (with Open/Download buttons for the PDF); then a player with the lecture's ACML Explains episodes (pick one from the list; a transcript under the player follows the episode, and its timestamps play from that point), the interactive lab and the games that fit (Markov's Maze, Echo Heist, Pirates War RL). Its section menu shows only on phones (below 768 px). The Tools page links to the course; the old `exploration-lab.html` now forwards there (its `#bandit-lab` / `#gridworld-lab` links go straight to the lab).

The nine labs, one per lecture: bandits (L2), dynamic programming (L3), contraction (L4), TD vs Monte Carlo (L5), Q-learning/SARSA gridworld (L6), Mountain Car with tile coding (L7), MCTS on tic-tac-toe (L9), policy-gradient bandit (L10) and Bradley–Terry from comparisons (L12). The bandit and gridworld labs run on `js/exploration-lab.js`; the other seven on `js/rl-labs.js` (with `css/rl-labs.css`). Everything runs in the visitor's browser.

Everything comes from `data/rl-course.json`: lectures (title, topics, summary, goal, source lecture, slide PDF, cover and first-slide images, episode numbers, labs, games with a "what to look for" line), episodes (YouTube id, title, duration, hook, takeaway, chapters, thumbnail), labs, games and the playlist id. The transcripts are in `data/rl-course-transcripts.json` (each episode's captions, grouped by chapter). After changing either, or a template in `tools/templates/rl-course*.html`, run:

```
python tools/build_rl_course.py
```

It writes the 13 pages, a share image (`share.jpg`) for each, and the course pages in `sitemap.xml` and `llms.txt`. Files the pages use: `rl-course/slides/*.pdf`, `rl-course/img/` (slide images, episode thumbnails, game screenshots, and the course-page drawing `teddy-bit-chess.svg`, with a `.png` copy for the share image), `css/rl-course.css` (on top of `css/project.css` and `css/videos.css`), `js/rl-course.js` (with `js/videos.js`), and for the labs `css/exploration-lab.css`, `css/rl-labs.css`, `js/exploration-lab.js` and `js/rl-labs.js`. The lab markup lives in `tools/templates/rl-course-lab-*.html`, which the Tailwind build scans, so the classes of the two older labs stay in `css/tailwind.css` (the newer labs use their own CSS).

The episodes are embedded with YouTube's privacy-enhanced player; until a video is public on YouTube, its player shows YouTube's own "private video" message.

## Epidemic Modeling course (epidemic-modeling/)

Teddy's epidemic-modeling course, one module per chapter of his textbook (T. Lazebnik, *Epidemic Modeling: Principles, Algorithms, and Applications*, Academic Press, 2026). Pages: `epidemic-modeling/` (the course page: how to study, the 13 modules in four parts, the game) and one page per finished module, `epidemic-modeling/module-01/` and on. Modules go online one at a time; the course page shows the others as "in production". A module page has the module's summary, goal and key ideas, the first slide with the PDF, the episodes with transcripts, and the game or lab that goes with it. Until the episodes are on YouTube their `youtube` field is empty and the player shows "Video coming soon"; add the ids to `data/epi-course.json` and rebuild.

Everything comes from `data/epi-course.json` (modules, episodes with transcripts, games). Styles: `css/rl-course.css` plus `css/epi-course.css`; script: `js/epi-course.js` (the RL course player, plus the "coming soon" state). The builder reuses the helpers of `tools/build_rl_course.py` and updates its own blocks in `sitemap.xml` and `llms.txt`:

```
python tools/build_epi_course.py
```

Labs: `js/epi-labs.js` holds every lab of the course in one file; a lab starts only when its root element (`data-epx="..."`) is on the page, and its markup lives in `tools/templates/epi-lab-*.html` (the builder adds it to the module page). The labs reuse `css/exploration-lab.css` and `css/rl-labs.css`. All numbers a lab shows come from the visitor's own runs in the browser.

## Images

Large images have `.webp` copies next to the originals, and the pages and data files point at the `.webp` versions. Keep the originals: share previews (`og:image`) still use PNG/JPEG. When you add a large photo, add a `.webp` copy as well (for example with https://squoosh.app), roughly 800 px wide for team photos and 1000 to 1200 px for cards and project images.

Team photos come in pairs: `img/lab/name.webp` and its hover photo `img/lab/hover-name.webp`. The Our Team page builds the hover path from the main photo's file name (same extension), so when `image_link` in `data/lab.json` ends in `.webp`, the hover photo must be a `.webp` too. Two people with the same first name need different file names (for example `amit.webp` and `amit-bengiat.webp`).

## Collaboration map on team.html

The "Who We Write With" map is drawn from `data/collab-map.js`. After adding new paper pages, update it with one command (no LLM, standard library only):

```
python tools/update_collab_map.py
```

It finds papers that have a `publications/<slug>/paper.json` but are not yet in `data/coauthor-affiliations.json`, looks up their authors' institutions and cities by DOI in OpenAlex (Crossref as a fallback), appends them, and runs `tools/build_statistics.py` to rewrite `data/collab-map.js` and `statistics-demo.html`. Use `--dry-run` to preview, `--redo-auto` to look up again papers that were too new for OpenAlex, and `--prune` to drop papers whose page was removed. Hand edits in `data/coauthor-affiliations.json` are kept; set `"confidence": "high"` on an automatic entry you corrected. Lookups are cached in `tools/.cache/`.
