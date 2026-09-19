# CalculatePilot homepage redesign

Replace only the homepage. Header, footer, and logo stay the existing site chrome so every other page remains consistent.

## What changed
- Homepage layout follows the attached `code.html` design (hero, platforms rail, embed banner, category cards, popular tools, two-column why/how, FAQ accordion).
- Sign In was not added.
- Logo remains `calculatepilot.`
- Existing search IDs and calculator widget hooks are unchanged (`siteSearchInput`, `data-calc-root`, etc.).
- Analytics, canonical, Open Graph, and FAQ schema are preserved.
- Sitewide language switcher lives in `js/language-switcher.js` and is loaded from `js/language-selector.js` on EN/ES/FR/DE.

## Deploy
1. Copy `index.html` to the site root only if replacing the current homepage.
2. Copy `css/home.css` to `/css/home.css`.
3. Leave `css/styles.css` and live `js/nav.js` untouched so header tools stay intact.
