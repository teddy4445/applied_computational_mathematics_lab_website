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
- `css/tailwind-default.css`: Tailwind's default theme. Used by `sock.html` and `project.html`, which never loaded the lab theme.

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
- **Search engines and AI tools.** `sitemap.xml` lists every paper page with its figures, and `llms.txt` lists every paper with authors, journal, DOI, a short summary and a link to its full text as Markdown (`paper.md`).

The site has a `.nojekyll` file so that GitHub Pages publishes the files as they are. Keep it: without it GitHub runs Jekyll, which tries to render every `paper.md` and fails.

## Images

Large images have `.webp` copies next to the originals, and the pages and data files point at the `.webp` versions. Keep the originals: share previews (`og:image`) still use PNG/JPEG. When you add a large photo, add a `.webp` copy as well (for example with https://squoosh.app), roughly 800 px wide for team photos and 1000 to 1200 px for cards and project images.

Team photos come in pairs: `img/lab/name.webp` and its hover photo `img/lab/hover-name.webp`. The Our Team page builds the hover path from the main photo's file name (same extension), so when `image_link` in `data/lab.json` ends in `.webp`, the hover photo must be a `.webp` too. Two people with the same first name need different file names (for example `amit.webp` and `amit-bengiat.webp`).
