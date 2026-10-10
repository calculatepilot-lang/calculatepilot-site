# CalculatePilot PSEO Engine: Design Spec

Date: 2026-10-11 | Owner: Suhaib Hassan | Status: awaiting owner review

## 1. Goal
A system that (a) harvests real search keywords from search-engine autocomplete, social and forum sources and Search Console data, (b) stores them in a database, (c) maps them to CalculatePilot calculators, (d) checks search intent, (e) generates guide pages that pass the owner's Programmatic SEO checklist (Programmatic_SEO_Master_Course.html, modules 02, 14-16, 18, 30, 36), (f) pings search engines to speed discovery, and (g) shows everything in a private dashboard.

## 2. Decisions already made with the owner
- Content engine: calculated + templated, **no AI key**. Unique value comes from real formulas; nothing is invented.
- Dashboard: **private generated file** (reports/dashboard.html), never deployed to public_html.
- Runs in a scheduled GitHub Action in the calculatepilot-site repo; can also run on any machine with Python 3.11+.
- Scope: **all calculators** on the site (158+, financial, math, health, everyday), read from the site's calculator list. Rollout order is by formula coverage (section 9), financial first.
- **Long-tail keywords are preferred**: 4+ word, specific-situation queries rank above head terms in scoring (section 7).
- Pages are written as draft files for review; nothing auto-publishes live.

## 3. Constraints
- Owner does not code: one command (`pseo run`) and plain-English reports.
- Site is static HTML (Python/Jinja2 generator). Guides are standalone `guides/*.html`; an existing Action lists new guides in `guides/index.html` and `sitemap-guides.xml`.
- The build sandbox cannot reach search engines, so network code is tested against recorded fixtures and runs live only in the owner's Action.
- Google cannot be forced to index. See section 8.

## 4. Architecture
Python package `pseo/`, SQLite file `data/pseo.db`, YAML config. Stages are independent CLI commands that read and write the database:

| Stage | Command | Reads | Writes |
|---|---|---|---|
| Harvest | `pseo harvest` | seeds from calculators | `keywords`, `keyword_sources` |
| Import | `pseo import <csv>` | GSC / Ahrefs / Semrush export | `keywords`, `gsc_metrics` |
| Analyze | `pseo analyze` | keywords | `intent`, `clusters`, `mappings`, `scores`, `rejections` |
| Generate | `pseo generate` | top clusters | `pages` (draft) + `guides/*.html` in `out/` |
| QA | `pseo qa` | pages | `gate_results`; failing pages set to HOLD |
| Publish | `pseo publish` | PASS pages | copies to repo `guides/`, adds links, updates sitemap lastmod |
| Ping | `pseo ping` | published URLs | `pings` |
| Dashboard | `pseo dashboard` | all tables | `reports/dashboard.html` |
| All | `pseo run` | | runs the above in order |

## 5. Data model (SQLite)
- `calculators(slug, name, category, url, formula_id)`: from config/`calculators.yml`.
- `keywords(id, text, normalized, first_seen, last_seen, source_count, est_volume NULL)`.
- `keyword_sources(keyword_id, source, query_seed, fetched_at)`; sources: google_ac, bing_ac, youtube_ac, ddg_ac, reddit, hn, stackexchange, gsc, ahrefs, semrush.
- `intent(keyword_id, label, confidence, rule)`: labels: calculate, compare, learn, convert, navigational, other.
- `clusters(id, canonical_keyword, intent, calculator_slug, decision, reason)`; decision: PAGE, MERGE, REJECT.
- `scores(cluster_id, demand, source_diversity, intent_fit, coverage_gap, total)`.
- `pages(id, cluster_id, slug, title, status, template_version, method_version, created_at, published_at)`; status: DRAFT, HOLD, PASS, PUBLISHED.
- `gate_results(page_id, gate, passed, detail, checked_at)`.
- `pings(url, engine, status_code, response, pinged_at)`.
- `gsc_metrics(page_url, date, clicks, impressions, ctr, position)`.

## 6. Keyword harvesting
Free public endpoints, rate-limited and polite (delay + User-Agent, retries, per-source on/off flags):
- Google, Bing, YouTube, DuckDuckGo autocomplete: seed expansion by appending a-z and question words (how, what, why, can, is, best, vs).
- Reddit public search JSON, Hacker News Algolia API, Stack Exchange API: question titles that mention each calculator topic.
- Optional (only if an env key exists): SerpApi "People also ask".
- CSV import for GSC, Ahrefs, Semrush exports (column auto-detect).
Keywords are normalized (lowercase, strip punctuation, collapse whitespace) and de-duplicated; every sighting is stored with its source.

**Suspicious-keyword quarantine (added 2026-10-11):** at insert time every keyword is checked against rules: adult, gambling, piracy/crack/keygen, scam and "get rich" bait, malware/hack terms, medical-miracle claims, URLs or email addresses, markup or script fragments, repeated-character spam, over 12 words, and brand-hijack terms (competitor or trademarked names in a navigational pattern). A match sets `keywords.quarantine_reason`; quarantined keywords stay in the database for audit but are excluded from clustering, scoring, pages and the harvest counts, and the dashboard lists them with the rule that fired.

## 7. Intent, clustering, mapping, scoring
- Intent: ordered rule set (e.g. "calculator", "how much", "monthly payment of" = calculate; "vs", "or", "difference" = compare; "what is", "how does", "formula" = learn). Rule that fired is stored for audit.
- Clustering: normalize, remove stop words, stem, compare token sets (Jaccard) within the same calculator and intent. Same-intent variants merge into one cluster (course module 08). Different target (e.g. "fixed vs variable") stays separate.
- Mapping: keyword must contain a calculator's topic terms (from config aliases) to map. Unmapped keywords are REJECTED with the reason "no matching calculator", never forced into a page.
- Long-tail definition: 4+ words after stop-word removal, or a specific situation modifier (person, life event, amount, rate, term, location, "with/without/after/for"). Long-tail harvesting adds modifier expansion to autocomplete seeds (who: "for seniors/students/self-employed"; when: "after tax/with extra payments"; what-if: "if rate changes"; amounts and terms).
- Score (0-100): demand (source count, GSC impressions where present), source diversity, intent fit (calculate/learn/compare score highest for a calculator site), **long-tail bonus (up to +20; head terms of 1-2 words get a penalty)**, coverage gap (no existing guide for that cluster), minus cannibalization penalty.
- Numeric long-tail guard: queries that differ only by a number ("$250k mortgage", "$300k mortgage") are NOT separate pages by default. They are folded into one hub guide as scenario-table rows (course module 06/07 token-swap warning). A separate page is allowed only when the modifier changes the logic, not just an input, and a per-calculator cap (default 5 numeric-variant pages) applies.
- **Intitle competition check (added 2026-10-11):** for the top clusters by pre-score, the system queries a SERP provider for `allintitle:"<canonical keyword>"` and stores the result count plus the top-10 result titles and domains in `serp_checks`. Competition bands: under 500 easy, 500-5,000 medium, over 5,000 hard. Easy and medium long-tail keywords gain up to +15; hard ones lose up to 10. Provider is pluggable: SerpApi first (key `SERPAPI_KEY`, weekly budget `intitle_budget`, default 100 checks), results cached for 30 days so a keyword is never re-checked inside that window. No scraping of Google result pages. With no key or exhausted budget the stage skips and the dashboard shows "intitle not checked"; the score then carries no intitle adjustment. The stored top-10 titles are used by gate 1 (our title must differ from every top-10 title) and shown in the dashboard.
- Course module 05 thresholds apply: 80+ strong, 70-79 pilot, 60-69 only with unique value, below 60 reject.

## 8. Indexing and ping tool
What is built:
1. **IndexNow**: key file served from site root; POST of newly published/updated URLs to the IndexNow endpoint (Bing, Yandex, Naver, Seznam). Batches up to 10,000 URLs, logged in `pings`.
2. **Google Search Console sitemap submit** via the Search Console API (`sitemaps.submit`) using a service-account or OAuth token stored as a GitHub secret. Sitemap `<lastmod>` is updated for each new or changed page.
3. **Manual-request queue**: dashboard lists the 10 highest-scoring unindexed URLs per day to request in Search Console by hand.
4. **Internal links**: every published page is linked from its calculator page area / silo hub and sibling guides so crawlers find it.
Not built, on purpose: Google Indexing API for non-job pages (unsupported by Google, may stop working) and any "ping" claiming to force Google indexing. The dashboard states this plainly.

## 9. Content generation
**Formula library** (`pseo/formulas/`): pure, unit-tested Python functions per calculator. Each exposes inputs, outputs, a table builder and a `method_version`. Coverage is tiered:
- Tier 1 (financial): mortgage, loan, auto loan, compound/simple interest, savings, savings goal, investment, retirement, 401k, Roth IRA, CD, annuity, credit card payoff, debt payoff, emergency fund, inflation, discount, sales tax, VAT, commission, debt-to-income, rental yield, refinance, amortization.
- Tier 2 (math and everyday): percentage, fractions, ratios, unit and date calculations, averages, area/volume, tip, split bill, time and age calculators.
- Tier 3 (health): BMI, BMR/TDEE, ideal weight, water intake, pregnancy due date and similar formula-based tools.
- **Coverage rule:** every calculator on the site is tracked. A calculator with no formula module still gets keyword harvesting, clustering and database entries, but its pages cannot pass gate 3 (page-level calculated value) and stay HOLD until its formula is added. The dashboard shows formula coverage per calculator so gaps are visible. Formulas are added in batches; the first release ships Tier 1 plus as much of Tier 2 as completes with passing tests.
- **Health/medical (YMYL) rule:** health pages include a visible "informational, not medical advice" note, use only formula outputs and `facts.yml` entries with source URL and verified date (no invented thresholds or claims), and require manual approval in the pull request before publishing.

**Page anatomy** (modules 14-15): title and H1 from the cluster's real intent; quick answer computed from a default scenario; worked example with the formula shown step by step; scenario table (3 to 5 input sets chosen from the keyword's own numbers when present, e.g. "$300,000 mortgage"); "who this is not for" and assumptions; FAQ limited to questions that appeared in harvested keywords for that cluster; links to the calculator and sibling guides; visible "How this page was made" note (inputs, formula source, method version, date); author byline "Suhaib Hassan" (existing decision). Site design system: teal #0F6B5C, Space Grotesk / Inter / IBM Plex Mono. The generator copies the head/header/footer from an existing guide at run time (`--template guides/<file>.html`) so layout matches the live site.

**Schema**: Article + FAQPage + BreadcrumbList JSON-LD generated only from visible content. No AggregateRating, no fake reviews.

**Truth rules**: no testing claims, no invented rates or statistics; any rate used is labeled as an illustrative assumption; real-world regulatory figures (tax brackets, contribution limits) are included only if supplied in `data/facts.yml` with source URL and verified date, otherwise the section is omitted and the page can HOLD.

## 10. Quality gates (course modules 18, 30, 36)
| # | Gate | Pass condition | On fail |
|---|---|---|---|
| 1 | Intent distinct | cluster decision is PAGE and no sibling page shares canonical keyword | MERGE/REJECT |
| 2 | Verified data | every number traces to a formula run or facts.yml entry | HOLD |
| 3 | Page-level value | at least 2 calculated modules specific to this cluster | HOLD |
| 4 | Duplication | shingle similarity to every sibling under 40% of meaningful content | HOLD, merge candidate |
| 5 | Truth | banned-phrase scan ("we tested", "guaranteed", fabricated ratings, unsourced stats) | HOLD |
| 6 | Internal links | parent hub + 2 to 5 sibling links + calculator link present | HOLD |
| 7 | Index controls | self-canonical present, no noindex, URL in sitemap list | HOLD |
| 8 | Schema match | every JSON-LD field is present in visible HTML; no rating markup | HOLD |
| 9 | Mobile/render | valid HTML, viewport meta, no horizontal-overflow patterns, tables wrapped | HOLD |
| 10 | Freshness | verified dates present; facts older than SLA flagged | HOLD |
Any failure of gates 2, 4 or 5 blocks publishing. Only pages with all gates PASS are copied to the repo. A pilot cap (default 25 pages per run, config) enforces the "50 strong URLs first" rule.

## 11. Dashboard (reports/dashboard.html)
Single self-contained file generated from the database (no server, no external scripts), with tabs:
- **Overview**: counts by status, keyword totals, last run, ping health.
- **Content**: table of pages: title, target keyword, calculator, status, score, gate results, "why held", file path, published/pinged dates; search and filter.
- **Keywords**: full list with source badges, intent, cluster, score, mapped calculator, rejected reason; filters and CSV export.
- **Indexing**: per-URL pings (engine, code, time), Search Console index status when imported, manual-request queue.
- **Performance**: clicks, impressions, position per page from imported GSC data.
Generated into `reports/` (git-ignored for deployment, kept as a downloadable Action artifact). Not placed in public_html.

## 12. Operations
- `config/settings.yml`: pilot cap, enabled sources, delays, thresholds.
- `config/calculators.yml`: slug, name, aliases, formula id; can be auto-built from the site's `sitemap.html`.
- Secrets (GitHub): `INDEXNOW_KEY`, `GSC_CREDENTIALS` (optional), `SERPAPI_KEY` (optional).
- GitHub Action `pseo.yml`: weekly schedule + manual button; commits new guides to a `pseo-drafts` branch and opens a pull request, so the owner reviews before anything goes live; uploads the dashboard as an artifact.
- Plain-English README with a 5-step setup.

## 13. Testing
Unit tests for formulas (known-answer cases), intent rules, clustering, each gate (pass and fail fixtures), IndexNow payload, sitemap lastmod; recorded-fixture tests for each harvester; one end-to-end run on fixtures that must produce passing pages, held pages, rejected keywords, a dashboard and a ping log.

## 14. Out of scope (v1)
AI-written prose, auto-publishing live, backlink building, paid keyword APIs, a hosted dashboard.

## 15. Risks
- Autocomplete and public endpoints can rate-limit or change; each source fails independently and is logged.
- Search volume is not available from free sources; "demand" is a proxy until GSC/Ahrefs/Semrush exports are imported.
- Template-driven pages can look similar; gates 3 and 4 and the pilot cap are the defense, and the dashboard shows held pages and why.
- With 158+ calculators, long-tail variants multiply quickly; the numeric-variant guard, per-calculator page cap and global pilot cap keep volume below what the checklist allows ("scale only from evidence").
- Formula coverage is the bottleneck: pages only exist where a real calculation can add value, so rollout speed depends on how many formula modules are finished and tested.
