# CalculatePilot site rules

## Guides / articles (mandatory)
Every page in `guides/` (except `guides/index.html`) MUST use the Stitch "Guide Article Template".
Never hand-write or paste a guide straight into `guides/`. To publish a new guide:
1. Write `tools/guides/src/<slug>.html` (plain source format, see `tools/guides/README.md`).
2. `python tools/guide_build.py <slug>` to generate `guides/<slug>.html`.
3. `python tools/guides/verify.py` and `python tools/guides/check.py` must pass BEFORE committing/publishing.
3b. `python tools/guides/index_sync.py <slug>` adds the guide's image card to the right category in `guides/index.html`. Every guide MUST have a hero image and an image card; comparison articles ("X vs Y") go in the Comparisons category.
If `check.py` fails, do not publish; rebuild with the builder. Daily/automated agents that add guides must follow the same steps.
