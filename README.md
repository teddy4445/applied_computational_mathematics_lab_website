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

## Images

Large images have `.webp` copies next to the originals, and the pages and data files point at the `.webp` versions. Keep the originals: share previews (`og:image`) still use PNG/JPEG. When you add a large photo, add a `.webp` copy as well (for example with https://squoosh.app), roughly 800 px wide for team photos and 1000 to 1200 px for cards and project images.
