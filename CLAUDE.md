# CalculatePilot site rules

## Guides / articles (mandatory)
Every page in `guides/` (except `guides/index.html`) MUST use the Stitch "Guide Article Template".
Never hand-write or paste a guide straight into `guides/`. To publish a new guide:
1. Write `tools/guides/src/<slug>.html` (plain source format, see `tools/guides/README.md`).
2. `python tools/guide_build.py <slug>` to generate `guides/<slug>.html`.
3. `python tools/guides/verify.py` and `python tools/guides/check.py` must pass BEFORE committing/publishing.
3b. `python tools/guides/index_sync.py <slug>` adds the guide's image card to the right category in `guides/index.html`. Every guide MUST have a hero image and an image card; comparison articles ("X vs Y") go in the Comparisons category.
If `check.py` fails, do not publish; rebuild with the builder. Daily/automated agents that add guides must follow the same steps.

## Site footer (mandatory)
Every page uses the same footer (dark green design, `css/footer.css`). Never hand-edit or paste a footer into a page.
Markup and translations (EN/ES/FR/DE) live in `tools/footer_build.py`; after adding a page or changing the footer run
`python tools/footer_build.py` (idempotent, rewrites every page). The homepage footers are also cloned by `js/nav.js` /
`js/locale-chrome.js` at runtime, so they must come from the generator too. Bump `CSS_VER` when `css/footer.css` changes.
