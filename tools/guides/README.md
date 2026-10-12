# Guide article template (Stitch "Guide Article Template")

Every page in `/guides/` (except `index.html`) is generated from a simple source file into the Stitch article layout:
reading-progress bar, breadcrumb strip, hero with badges/byline, sticky contents sidebar, Short answer / Key takeaways
callout, dark formula cards, tables, FAQ accordions, related tools + related guides, corrections strip, previous/next.

## Publish a new guide

1. Write `tools/guides/src/<slug>.html` in the plain source format (copy any file in `src/` as a starting point):
   `<head>` with title, meta description, canonical, OG tags and Article/FAQPage JSON-LD; `<main>` with
   `section.calc-page-head` (breadcrumb, `h1`, `p.lede`) and `div.prose` containing only
   `p`, `h2`, `h3`, `ul`, `ol`, `table`, `img`, `div.formula-box`, `div.faq-item`, `div.tool-grid`.
   - First line of the prose: `<p><a href="/financial/x-calculator.html">→ Use the free X Calculator</a></p>` (drives the sidebar CTA and "Related tools").
   - A paragraph starting `<strong>Short answer:</strong>` becomes the top callout. Without one, add 3 hand-written
     bullets for the slug in `takeaways.json` (`[[bold label, sentence], ...]`); otherwise they are derived from the first sections.
   - End with `<p><a class="btn btn-primary" href="...">Calculate ... →</a></p>` for the bottom button.
2. `python tools/guide_build.py <slug>` (no arguments rebuilds every guide). Writes `guides/<slug>.html`
   and adds the slug to `meta.json` (category/tag from the guides index card, read time, publish date, sandbox).
3. The builder adds the Article + BreadcrumbList schema and the `sitemap-guides.xml` entry automatically (backfill an existing guide: `python tools/guide_build.py --schema-only <slug>`). Still manual: `llms-full.txt` and `calculators.json` (the guides index card is `index_sync.py`, below).
4. Gate (required before publishing): `python tools/guides/check.py` (every guide uses the template, has Article + BreadcrumbList schema and is in `sitemap-guides.xml`; also run by the `Guides check` workflow) and `python tools/guides/verify.py` (no source words lost).

## Notes
- The built page keeps its own `<head>` and site header/footer, so site-wide edits survive a rebuild. Only `<main>` is regenerated.
- `meta.json` `sandbox` (`principal`, `rate`, `years`, `title`) adds the live loan sandbox after the first formula section.
- New Tailwind classes: edit `guide_build.py`, then `TW_DIR=<folder with node_modules> sh tools/guides/css/rebuild.sh`
  (needs tailwindcss@3, @tailwindcss/forms, @tailwindcss/container-queries, postcss, postcss-prefix-selector, cssnano).
- Assets: `css/cp-guide.css` (scoped under `.cpguide`), `js/cp-guide.js`. Fonts: Space Grotesk, Inter, IBM Plex Mono + a Material Symbols subset.
- Left out of the Stitch mock on purpose because they were fabricated or have no backend: "peer-reviewed", named reviewers/CFA credentials,
  CFPB verification, vote counts, XLSX download, newsletter form.

## Categories and image cards (required)
- Every guide needs a hero image (`<img src="/images/guides/...">` in the source) and an image card in `guides/index.html`.
- Category = `meta.json` `group`: Finance & money, Math & conversion, Health & everyday, or **Comparisons** (any "X vs Y" / site-vs-site / tool-vs-tool article; auto-detected from "vs" in the slug or title).
- `python tools/guides/index_sync.py <slug>` adds the image card to the right category section (creating the section/chip if needed) and refreshes all counts.
- `check.py` fails if a guide has no hero image, no index card, a card without an image, or a card in the wrong category.
