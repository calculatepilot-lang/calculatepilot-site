# CalculatePilot SEO engine

Finds long-tail keywords (search autocomplete, Reddit, Hacker News, Stack Exchange, plus your
own Search Console / Ahrefs / Semrush CSV exports), checks intent and competition, matches them
to your calculators, and builds draft guide pages that must pass all 10 checklist gates.
Nothing goes live by itself: you review a pull request.

## Set up in five steps

**Step 1 - Copy the folder.** Put the contents of this folder (including the hidden `.github`
folder) at the top level of your CalculatePilot GitHub repository.

**Step 2 - Add your secrets (all optional).** Repository > Settings > Secrets and variables >
Actions > New secret:
- `INDEXNOW_KEY` - any random 32-character string; turns on instant IndexNow pings (Bing, Yandex).
- `GSC_CREDENTIALS` - Google service-account JSON; submits the guides sitemap to Search Console.
- `SERPAPI_KEY` - turns on real `intitle:` competition counts.

**Step 3 - Run it.** Actions tab > "CalculatePilot SEO engine" > Run workflow. It also runs every Monday.

**Step 4 - Open the dashboard.** Open the finished run and download the `dashboard` file, then open
`dashboard.html` in your browser. It lists keywords, scores, pages and gate results. It is private;
never commit it.

**Step 5 - Review the pull request.** Read the drafts, merge what you like. Pages in
`out/needs-approval/` (health or finance-sensitive) need your careful read first.

## Commands (for running on your own computer)

| Command | What it does |
|---|---|
| `pseo run` | Everything below, in order |
| `pseo sync-calculators` | Refresh the calculator list from your live sitemap |
| `pseo harvest` | Collect keywords from autocomplete and forums |
| `pseo import file.csv` | Add a Search Console / Ahrefs / Semrush export |
| `pseo analyze` | Intent, clusters, calculator mapping, scores, intitle checks |
| `pseo generate` / `pseo qa` | Build drafts and run the 10 gates |
| `pseo publish` | Write passing drafts to `out/` |
| `pseo ping` | IndexNow + Search Console sitemap (cannot force Google to index) |
| `pseo dashboard` | Rebuild `reports/dashboard.html` |

Add `--offline` to any command to skip network calls.

## Good to know
- Run `pseo sync-calculators` against your live sitemap once, so all 158+ calculators are covered.
  Calculators without a formula are held, not guessed.
- Guide pages use the mapped calculator's base formula; unusual phrases get the base worked example.
- Google decides when to index. Pinging only tells engines the pages exist.
