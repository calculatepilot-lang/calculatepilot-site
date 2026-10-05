# Core pages (Stitch project 7558606479534104249)

Source fragments for about, methodology, privacy, terms, embed and pricing. `tools/core_apply.py` swaps only the `<main>`
of each live page, keeping the site header/footer/analytics. Styles are a Tailwind build scoped under `.cpcore`
(`tools/core-css`, output `css/cp-core.css`; pricing extras in `css/cp-pricing.css`). `embed/index.php` wraps
`embed/index.html` at runtime and injects the Creem checkout and license validation.
