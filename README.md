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

Each paper can have its own page at `publications/<slug>/` with the full text, figures, tables and references, a short summary, and the tags Google Scholar reads. The Publications list links a paper's title (and shows "Read online") only when its page exists.

One folder per paper, `publications/<slug>/`:

- `paper.md`: the full text. Fix anything the PDF extraction got wrong here.
- `paper.json`: title, authors, journal, dates, licence, abstract, and the "at a glance" summary, key findings and key numbers. `"reviewed": true` stops the extractor from overwriting your edits.
- `figures/`: the figures as WebP.
- `<slug>.pdf`: a copy of the PDF (Google Scholar wants it next to the page).
- `index.html`: made by the build script. Don't edit it.

Add a paper:

1. `pip install -r tools/requirements.txt` (once).
2. `python tools/paper_extract.py path/to/paper.pdf --slug short-name-for-the-address`
3. Check `paper.md` against the PDF, fill in `summary`, `key_findings`, `key_numbers` and `related_project` in `paper.json`, and set `"reviewed": true`.
4. `python tools/build_papers.py`. This builds every paper page and updates `data/paper-pages.json`, `sitemap.xml` and `llms.txt`.

Only make full-text pages for papers whose licence allows it (for example CC BY open access). For other journals, check what the publisher allows on an author's website.

## Images

Large images have `.webp` copies next to the originals, and the pages and data files point at the `.webp` versions. Keep the originals: share previews (`og:image`) still use PNG/JPEG. When you add a large photo, add a `.webp` copy as well (for example with https://squoosh.app), roughly 800 px wide for team photos and 1000 to 1200 px for cards and project images.

Team photos come in pairs: `img/lab/name.webp` and its hover photo `img/lab/hover-name.webp`. The Our Team page builds the hover path from the main photo's file name (same extension), so when `image_link` in `data/lab.json` ends in `.webp`, the hover photo must be a `.webp` too. Two people with the same first name need different file names (for example `amit.webp` and `amit-bengiat.webp`).
