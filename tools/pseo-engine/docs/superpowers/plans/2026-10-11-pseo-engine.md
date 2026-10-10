# CalculatePilot PSEO Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI pipeline that harvests long-tail keywords, stores them in SQLite, maps and scores them against every CalculatePilot calculator, generates formula-backed guide pages, gates them with the owner's 10 checklist gates, pings search engines, and renders a private dashboard.

**Architecture:** One Python package `pseo/` with independent stage modules that read and write one SQLite file (`data/pseo.db`). A thin CLI (`pseo harvest|import|analyze|generate|qa|publish|ping|dashboard|run`) calls the stages. Network code sits behind small source classes that tests replace with recorded fixtures.

**Tech Stack:** Python 3.11+, stdlib `sqlite3`/`urllib`/`html`, `PyYAML`, `Jinja2`, `pytest`. No other runtime dependencies. No AI API.

**Spec:** `docs/superpowers/specs/2026-10-11-pseo-engine-design.md`

## Global Constraints

- Python 3.11+; runtime deps limited to PyYAML and Jinja2 (spec section 12: owner does not code, free stack).
- Network access only in `harvest/` sources, `ping.py` and calculator-list fetch; every network call has a timeout of 15s, a 1s default delay between requests, a `User-Agent` header, and fails per source without stopping the run (spec 6, 15).
- No AI-written prose; every number in a page comes from a formula run or `config/facts.yml` with `source_url` and `verified_at` (spec 2, 9).
- Pilot cap: 25 pages per run (`settings.yml: pilot_cap`). Numeric-variant cap: 5 pages per calculator. Duplicate threshold: shingle similarity under 40% (spec 7, 10).
- Score thresholds: 80+ strong, 70-79 pilot, 60-69 only with unique value, below 60 reject. Long-tail bonus up to +20 (spec 7).
- Author byline "Suhaib Hassan". Design tokens: teal `#0F6B5C`, Space Grotesk / Inter / IBM Plex Mono (spec 9).
- Dashboard is a single self-contained file in `reports/`, never written to a public web folder (spec 11).
- Pages never auto-publish live: `publish` writes to an output folder and the Action opens a pull request (spec 2, 12).
- Health pages carry the "informational, not medical advice" note and a `needs_manual_approval` flag (spec 9).

## Review Focus

1. Harvested text containing HTML, quotes or `<script>` (forum titles are untrusted) must be escaped in every generated page and in the dashboard. Pinned in Tasks 9 and 13.
2. A source that returns HTTP 429, an HTML error page, empty JSON or times out must be logged and skipped while other sources continue. Pinned in Tasks 3 and 4.
3. Zero-rate, zero-term and zero-principal inputs in formulas must return a defined result or raise `ValueError`, never divide by zero. Pinned in Task 8.
4. Running any stage twice must not duplicate keywords, pages or pings. Pinned in Tasks 2, 11 and 12.
5. A calculator with no formula module must produce HOLD pages and a dashboard coverage row, not a crash. Pinned in Tasks 10 and 13.

---

## File Structure

```
pyproject.toml            package metadata, entry point `pseo`
config/settings.yml       pilot_cap, delays, thresholds, enabled sources
config/calculators.yml    slug, name, category, url, aliases, formula_id
config/facts.yml          sourced real-world figures (starts empty)
pseo/config.py            load settings and calculators
pseo/db.py                schema + connection helper
pseo/normalize.py         keyword normalization, tokens, long-tail test
pseo/store.py             keyword/source/page/ping read-write functions
pseo/harvest/base.py      Source base class, HTTP helper
pseo/harvest/autocomplete.py   google, bing, youtube, ddg
pseo/harvest/community.py      reddit, hn, stackexchange
pseo/harvest/imports.py        GSC/Ahrefs/Semrush CSV
pseo/harvest/expand.py         seed + modifier expansion
pseo/analyze/intent.py, cluster.py, mapping.py, score.py
pseo/formulas/__init__.py      registry; tier1.py, tier2.py, tier3.py
pseo/generate/builder.py, schema.py, templates/guide.html.j2
pseo/qa/gates.py
pseo/publish.py, pseo/ping.py, pseo/dashboard.py, pseo/cli.py
tests/ (one test file per module), tests/fixtures/
.github/workflows/pseo.yml, README.md
```

---

### Task 1: Scaffold, config, database schema

**Files:**
- Create: `pyproject.toml`, `config/settings.yml`, `config/calculators.yml`, `config/facts.yml`, `pseo/__init__.py`, `pseo/config.py`, `pseo/db.py`
- Test: `tests/test_config_db.py`

**Interfaces:**
- Produces: `config.load_settings(path) -> dict`; `config.load_calculators(path) -> list[Calculator]` where `Calculator` is a dataclass `(slug, name, category, url, aliases: list[str], formula_id: str | None)`; `config.calculators_from_sitemap_html(html: str, base_url: str) -> list[Calculator]` (reads the site's sitemap.html links); `db.connect(path) -> sqlite3.Connection` that creates every table from spec section 5 if missing (`calculators, keywords, keyword_sources, intent, clusters, scores, pages, gate_results, pings, gsc_metrics`) with `PRAGMA foreign_keys=ON`.

- [ ] **Step 1: Write failing tests** `test_schema_creates_all_tables` (asserts the 10 table names), `test_connect_is_idempotent` (connect twice, no error), `test_load_calculators_reads_aliases`, `test_sitemap_html_parser_extracts_slug_and_name` (fixture with two `<a href="/mortgage-calculator.html">Mortgage Calculator</a>` links gives slugs `mortgage-calculator`, `...`)
- [ ] **Step 2:** Run `pytest tests/test_config_db.py -v`; expect FAIL (modules missing)
- [ ] **Step 3:** Implement the interfaces above. `settings.yml` defaults: `pilot_cap: 25`, `numeric_variant_cap: 5`, `request_delay: 1.0`, `similarity_max: 0.40`, `sources: all true`, `site_url: https://calculatepilot.com`.
- [ ] **Step 4:** Run tests; expect PASS
- [ ] **Step 5:** Commit `feat: scaffold, config and database schema`

### Task 2: Normalization and keyword store

**Files:**
- Create: `pseo/normalize.py`, `pseo/store.py`
- Test: `tests/test_normalize_store.py`

**Interfaces:**
- Consumes: `db.connect`
- Produces: `normalize.normalize(text: str) -> str` (lowercase, strip punctuation except `$ % .`, collapse whitespace); `normalize.tokens(text: str) -> list[str]` (stop words removed); `normalize.is_long_tail(text: str) -> bool` (4+ tokens after stop-word removal, or contains a situation modifier from a fixed list: `for, with, without, after, before, if, when, per, vs`); `store.add_keyword(conn, text, source, seed, fetched_at) -> int` returns keyword id, de-duplicates on `normalized`, always records a `keyword_sources` row, updates `last_seen` and `source_count`.

- [ ] **Step 1: Write failing tests** `test_normalize_collapses_case_and_space` (`"  Mortgage   CALCULATOR!! "` -> `"mortgage calculator"`), `test_is_long_tail_true_for_situation` (`"mortgage payment for first time buyer"`), `test_is_long_tail_false_for_head_term` (`"mortgage calculator"`), `test_add_keyword_dedupes_and_counts_sources` (same keyword from two sources gives one row, `source_count == 2`), `test_add_keyword_twice_same_source_is_idempotent_for_count`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement. Idempotency: unique index on `(keyword_id, source, query_seed)`.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: keyword normalization and store`

### Task 2b: Suspicious-keyword quarantine

**Files:**
- Create: `pseo/quarantine.py`, `config/quarantine_terms.yml`
- Modify: `pseo/db.py` (add `keywords.quarantine_reason TEXT NULL`), `pseo/store.py` (`add_keyword` sets it)
- Test: `tests/test_quarantine.py`

**Interfaces:**
- Produces: `quarantine.reason(text: str) -> str | None` returns the rule name (`adult, gambling, piracy, scam, malware, miracle_claim, url_or_email, markup, char_spam, too_long, brand_hijack`) or None; term lists live in `quarantine_terms.yml`; `store.active_keywords(conn)` returns only rows with `quarantine_reason IS NULL`, and every later stage (intent, cluster, score) reads through it.

- [ ] **Step 1: Write failing tests** `test_adult_term_quarantined`, `test_piracy_keygen_quarantined`, `test_scam_get_rich_quarantined`, `test_url_quarantined`, `test_email_quarantined`, `test_script_markup_quarantined` (`"<script>x</script> mortgage"`), `test_char_spam_quarantined` (`"mortgageeeeeeeee calculator"`), `test_over_12_words_quarantined`, `test_clean_keyword_passes` (`"mortgage payment for first time buyer"` gives None), `test_quarantined_excluded_from_active_keywords`, `test_quarantined_still_stored_with_reason`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement `reason()` as ordered checks over normalized text and the raw text (markup/URL checks use raw text before normalization).
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: suspicious keyword quarantine`

### Task 3: Autocomplete harvesters and long-tail expansion

**Files:**
- Create: `pseo/harvest/base.py`, `pseo/harvest/autocomplete.py`, `pseo/harvest/expand.py`, `tests/fixtures/google_ac.json`, `bing_ac.json`, `youtube_ac.txt`, `ddg_ac.json`
- Test: `tests/test_autocomplete.py`

**Interfaces:**
- Consumes: `store.add_keyword`
- Produces: `base.Source` with `name: str`, `fetch(query: str) -> list[str]`, and `http_get(url, params, delay, timeout=15) -> str | None` (returns None on any error or non-200, logging the reason); `autocomplete.GoogleAC, BingAC, YouTubeAC, DDGAC` (each takes an injectable `http_get`); `expand.expand_seed(seed: str) -> list[str]` returns `seed` + letter suffixes a-z + question prefixes (`how, what, why, can, is, best`) + situation modifiers (`for seniors, for students, for self employed, after tax, with extra payments, if rate changes`); `expand.harvest(conn, sources, calculators, settings) -> dict[str, int]` returns count of new keywords per source; one failing source never stops the others.

- [ ] **Step 1: Write failing tests** `test_google_parses_fixture` (fixture gives expected list), `test_bing_parses_fixture`, `test_youtube_parses_fixture`, `test_ddg_parses_fixture`, `test_source_returns_empty_on_http_none` (injected `http_get` returns None gives `[]`), `test_source_returns_empty_on_html_error_page`, `test_expand_seed_includes_modifiers_and_letters`, `test_harvest_continues_when_one_source_raises` (one fake source raises, others still stored; result dict shows 0 for the failing one), `test_harvest_rerun_adds_no_duplicates`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement parsers per endpoint format (Google/Bing/YouTube/DDG public suggest endpoints). Wrap each `fetch` in try/except in `harvest`.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: autocomplete harvesters and long-tail expansion`

### Task 4: Community sources and CSV imports

**Files:**
- Create: `pseo/harvest/community.py`, `pseo/harvest/imports.py`, fixtures `reddit.json`, `hn.json`, `stackexchange.json`, `gsc.csv`, `ahrefs.csv`, `semrush.csv`
- Test: `tests/test_community_imports.py`

**Interfaces:**
- Produces: `community.RedditSource, HNSource, StackExchangeSource` (same `Source` interface; return question-style titles only, titles over 12 words or under 3 are dropped); `imports.import_csv(conn, path, kind: str | None = None) -> int` auto-detects `gsc` (columns Query, Clicks, Impressions), `ahrefs` (Keyword, Volume) or `semrush` (Keyword, Search Volume), stores keywords with source name, and stores GSC rows into `gsc_metrics`; raises `ValueError` with a plain-English message on unknown columns.

- [ ] **Step 1: Write failing tests** `test_reddit_parses_fixture_titles`, `test_hn_parses_fixture`, `test_stackexchange_parses_fixture`, `test_community_drops_overlong_titles`, `test_source_handles_429` (injected response None gives `[]`), `test_import_detects_gsc`, `test_import_detects_ahrefs`, `test_import_detects_semrush`, `test_import_unknown_columns_raises_plain_message`, `test_import_twice_is_idempotent`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement using public endpoints (Reddit `search.json`, HN Algolia, Stack Exchange API).
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: community harvesters and CSV imports`

### Task 5: Intent classifier

**Files:**
- Create: `pseo/analyze/intent.py`
- Test: `tests/test_intent.py`

**Interfaces:**
- Produces: `intent.classify(text: str) -> tuple[str, float, str]` returning `(label, confidence, rule)`; labels `calculate, compare, learn, convert, navigational, other`; ordered rules (compare: `vs`, `versus`, `or`, `difference between`; learn: `what is`, `how does`, `formula`, `explained`; convert: `to` between two unit words or `convert`; calculate: contains `calculator`, `calculate`, `how much`, `monthly payment`, `estimate`; navigational: contains a brand like `calculatepilot`); `intent.run(conn) -> int` writes `intent` rows for keywords lacking one.

- [ ] **Step 1: Write failing tests** `test_calculate`, `test_compare` (`"fixed vs variable mortgage"`), `test_learn` (`"what is apr"`), `test_convert`, `test_navigational`, `test_other_default`, `test_rule_name_is_returned`, `test_run_skips_already_classified`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement as an ordered list of `(label, rule_name, regex)`.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: intent classifier`

### Task 6: Clustering with numeric-variant guard

**Files:**
- Create: `pseo/analyze/cluster.py`
- Test: `tests/test_cluster.py`

**Interfaces:**
- Consumes: `normalize.tokens`, `intent` rows
- Produces: `cluster.jaccard(a: set[str], b: set[str]) -> float`; `cluster.strip_numbers(text: str) -> str`; `cluster.build(conn, threshold: float = 0.6, numeric_cap: int = 5) -> int` creates `clusters` rows where same-intent keywords with Jaccard of at least `threshold` merge (canonical = longest long-tail member); keywords that differ only by numbers share one cluster and the cluster stores `numeric_variants` for use as scenario rows; clusters beyond `numeric_cap` per calculator get `decision='MERGE'`.

- [ ] **Step 1: Write failing tests** `test_jaccard_basic`, `test_same_intent_variants_merge` (`"best home mortgage calculator"` + `"mortgage calculator for home"`), `test_different_intent_stays_separate` (calculate vs compare), `test_numeric_only_variants_become_one_cluster_with_variants` (`"$250k mortgage payment"`, `"$300k mortgage payment"`), `test_numeric_cap_forces_merge`, `test_rebuild_is_idempotent`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement greedy clustering over sorted keywords; keep `numeric_variants` as a JSON column on `clusters`.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: clustering with numeric variant guard`

### Task 7: Calculator mapping and scoring

**Files:**
- Create: `pseo/analyze/mapping.py`, `pseo/analyze/score.py`
- Test: `tests/test_mapping_score.py`

**Interfaces:**
- Produces: `mapping.map_cluster(canonical: str, calculators: list[Calculator]) -> Calculator | None` (longest alias/name token overlap wins; ties go to the more specific calculator; none matches gives None); `mapping.run(conn, calculators) -> dict` sets `clusters.calculator_slug` or `decision='REJECT', reason='no matching calculator'`; `score.score_cluster(conn, cluster_id) -> float` per spec 7 (demand, source diversity, intent fit, long-tail bonus up to +20, head-term penalty, coverage gap, cannibalization penalty); `score.run(conn) -> int`; `score.band(total: float) -> str` returns `strong|pilot|needs-moat|reject` using 80/70/60.

- [ ] **Step 1: Write failing tests** `test_maps_specific_calculator`, `test_unmapped_is_rejected_with_reason`, `test_long_tail_scores_above_head_term` (same demand), `test_head_term_penalized`, `test_band_thresholds` (80, 79.9, 70, 60, 59.9), `test_existing_guide_lowers_coverage_gap`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: calculator mapping and scoring`

### Task 7b: Intitle competition check

**Files:**
- Create: `pseo/analyze/intitle.py`, `tests/fixtures/serpapi_allintitle.json`
- Modify: `pseo/db.py` (table `serp_checks(keyword, allintitle_count, top_titles_json, top_domains_json, checked_at, provider)`), `pseo/analyze/score.py` (intitle adjustment), `config/settings.yml` (`intitle_budget: 100`, `intitle_cache_days: 30`)
- Test: `tests/test_intitle.py`

**Interfaces:**
- Consumes: clusters, scores
- Produces: `intitle.Provider` base with `allintitle(keyword: str) -> SerpResult | None`, where `SerpResult = (count: int, titles: list[str], domains: list[str])`; `intitle.SerpApiProvider(api_key, http_get=None)` queries `allintitle:"<keyword>"` and reads `search_information.total_results` plus organic result titles; `intitle.band(count: int) -> str` returns `easy` (under 500), `medium` (500-5,000) or `hard`; `intitle.run(conn, provider, settings) -> dict` checks top clusters by pre-score within `intitle_budget`, skips keywords cached inside `intitle_cache_days`, and never raises on provider failure; `score.intitle_adjustment(band: str | None) -> float` (+15 easy, +7 medium, -10 hard, 0 when None).

- [ ] **Step 1: Write failing tests** `test_band_thresholds` (499, 500, 5000, 5001), `test_serpapi_parses_fixture_count_and_titles`, `test_provider_none_on_http_error`, `test_run_respects_budget`, `test_run_uses_cache_inside_30_days`, `test_run_rechecks_after_cache_expiry`, `test_run_without_key_skips_and_reports_not_checked`, `test_provider_failure_does_not_stop_run`, `test_adjustment_values`, `test_no_check_means_zero_adjustment`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement with injectable `http_get`; the keyword is passed as a URL parameter (never string-concatenated into a URL).
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: intitle competition check`

### Task 8: Formula framework and Tier 1 formulas

**Files:**
- Create: `pseo/formulas/__init__.py`, `pseo/formulas/tier1.py`
- Test: `tests/test_formulas_tier1.py`

**Interfaces:**
- Produces: `formulas.register(formula_id)` decorator and `formulas.get(formula_id) -> Formula | None`; `Formula` dataclass `(id, inputs: dict[str, InputSpec], run: Callable[..., dict], table: Callable[..., list[dict]], steps: Callable[..., list[str]], method_version: str)`; `formulas.coverage(calculators) -> dict[slug, bool]`. Tier 1 ids: `mortgage, loan, auto_loan, compound_interest, simple_interest, savings, savings_goal, investment, retirement, roth_ira, k401, cd, annuity, credit_card_payoff, debt_payoff, emergency_fund, inflation, discount, sales_tax, vat, commission, dti, rental_yield, refinance, amortization`. All raise `ValueError` for negative principal or negative term; zero rate is handled explicitly.

- [ ] **Step 1: Write failing tests** with known answers, e.g. `test_mortgage_300k_6pct_30y` (monthly payment 1798.65 within 0.01), `test_loan_zero_rate_is_principal_over_term` (12000 over 12 months gives 1000), `test_compound_interest_known_value` (1000 at 5% for 10y monthly compounding gives 1647.01 within 0.01), `test_simple_interest_known_value`, `test_discount_and_sales_tax_known_values`, `test_dti_ratio`, `test_zero_term_raises_value_error`, `test_negative_principal_raises_value_error`, `test_zero_rate_all_amortizing_formulas_no_zero_division`, `test_amortization_table_balance_ends_at_zero`, `test_registry_returns_none_for_unknown`, `test_coverage_marks_missing`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement formulas as pure functions; `steps()` returns the plain-English worked-example lines with the actual numbers substituted.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: formula framework and tier 1 financial formulas`

### Task 9: Page builder, schema and template

**Files:**
- Create: `pseo/generate/builder.py`, `pseo/generate/schema.py`, `pseo/generate/templates/guide.html.j2`
- Test: `tests/test_builder.py`

**Interfaces:**
- Consumes: `formulas.get`, clusters, `config.facts`
- Produces: `builder.build_page(cluster: ClusterRow, calc: Calculator, facts: dict, template_html: str | None, today: date) -> Page` where `Page` is `(slug, title, html, sections: list[str], data_points: list[DataPoint], needs_manual_approval: bool)` and `DataPoint = (value, origin)` with origin `formula:<id>` or `fact:<key>`; sections in order: quick answer, worked example, scenario table (rows from the cluster's `numeric_variants` plus three defaults), assumptions and who this is not for, FAQ (only questions found in the cluster's keywords), related links, "How this page was made" note; `schema.jsonld(page, url) -> str` emits Article + FAQPage + BreadcrumbList only from visible content; `builder.load_site_shell(guide_html: str) -> str` extracts head/header/footer from an existing guide so output matches the site; slug is derived from the canonical keyword; health calculators set `needs_manual_approval=True` and include the medical note.

- [ ] **Step 1: Write failing tests** `test_page_has_all_required_sections`, `test_every_number_has_formula_or_fact_origin`, `test_scenario_table_uses_numeric_variants`, `test_faq_only_from_harvested_questions`, `test_howmade_note_present_with_method_version_and_date`, `test_jsonld_has_no_aggregate_rating`, `test_jsonld_fields_appear_in_visible_html`, `test_keyword_with_html_is_escaped` (canonical `'<script>alert(1)</script> mortgage'` must not appear raw in html or JSON-LD), `test_health_page_flags_manual_approval_and_note`, `test_missing_formula_returns_none`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement with Jinja2 `autoescape=True`; JSON-LD built with `json.dumps` and `</` escaped.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: page builder, schema and template`

### Task 10: Quality gates

**Files:**
- Create: `pseo/qa/gates.py`
- Test: `tests/test_gates.py`

**Interfaces:**
- Consumes: `Page`, `pages` table, sibling pages
- Produces: `gates.run_all(conn, page_id: int, page: Page, siblings: list[Page], settings) -> list[GateResult]` where `GateResult = (gate: int, name: str, passed: bool, detail: str)` for gates 1-10 as spec section 10; `gates.shingle_similarity(a: str, b: str, k: int = 5) -> float` on visible text; `gates.apply_status(conn, page_id, results) -> str` sets `PASS` only if all pass, else `HOLD`; gates 2, 4 and 5 failures are recorded as blocking in `detail`; banned phrases list: `we tested, we reviewed, guaranteed, best in class, proven, experts agree` plus any `%` figure not traceable to a data point.

- [ ] **Step 1: Write failing tests** one pass and one fail per gate: `test_gate1_*`, `test_gate2_untraceable_number_fails`, `test_gate3_needs_two_calculated_modules`, `test_gate4_similarity_over_40_percent_fails`, `test_gate5_banned_phrase_fails`, `test_gate6_missing_calculator_link_fails`, `test_gate7_missing_canonical_fails`, `test_gate8_schema_field_not_in_html_fails`, `test_gate9_missing_viewport_fails`, `test_gate10_old_fact_flagged`, `test_page_with_no_formula_is_hold_not_crash`, `test_apply_status_pass_only_when_all_pass`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement each gate as a small function returning `GateResult`.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: ten quality gates`

### Task 11: Generate stage and publish

**Files:**
- Create: `pseo/publish.py`
- Modify: `pseo/store.py` (add `save_page`, `set_status`, `pages_by_status`)
- Test: `tests/test_publish.py`

**Interfaces:**
- Consumes: builder, gates, `settings.pilot_cap`
- Produces: `publish.generate(conn, calculators, settings, today) -> list[int]` builds pages for clusters with decision PAGE ordered by score, up to `pilot_cap` new pages, stores DRAFT then runs gates; `publish.publish(conn, out_dir: Path, settings, today) -> list[Path]` writes only PASS pages that are not `needs_manual_approval` (those go to `out_dir/needs-approval/`), adds sibling and hub links, updates `sitemap-guides.xml` `<lastmod>` entries, and sets status PUBLISHED with `published_at`; re-running neither duplicates pages nor rewrites unchanged files.

- [ ] **Step 1: Write failing tests** `test_generate_respects_pilot_cap`, `test_generate_skips_clusters_that_already_have_pages`, `test_publish_writes_only_pass_pages`, `test_publish_routes_health_pages_to_needs_approval`, `test_publish_twice_is_idempotent`, `test_sitemap_lastmod_updated`, `test_hold_pages_are_never_written`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: generate and publish stages`

### Task 12: Ping tool

**Files:**
- Create: `pseo/ping.py`
- Test: `tests/test_ping.py`

**Interfaces:**
- Produces: `ping.indexnow_payload(urls: list[str], host: str, key: str) -> dict`; `ping.submit_indexnow(conn, urls, host, key, post=None) -> int` batches up to 10,000 URLs, logs one `pings` row per URL with engine `indexnow`, status code and response, skips URLs already pinged successfully since their `published_at`; `ping.submit_gsc_sitemap(conn, sitemap_url, site_url, token_provider=None, request=None) -> bool` calls the Search Console `sitemaps.submit` endpoint, returns False with a logged plain-English reason when credentials are missing; `ping.manual_queue(conn, limit: int = 10) -> list[str]` highest-scoring published URLs with no confirmed index; `ping.write_key_file(key: str, out_dir: Path) -> Path` writes `<key>.txt`.

- [ ] **Step 1: Write failing tests** `test_indexnow_payload_shape` (keys `host, key, keyLocation, urlList`), `test_submit_batches_over_10000`, `test_submit_logs_status_codes`, `test_submit_skips_already_pinged`, `test_submit_failure_logged_not_raised`, `test_gsc_submit_without_credentials_returns_false_with_reason`, `test_manual_queue_orders_by_score_limit_10`, `test_key_file_content_equals_key`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement with injectable `post`/`request` callables so tests make no network calls.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: IndexNow and Search Console sitemap ping`

### Task 13: Dashboard

**Files:**
- Create: `pseo/dashboard.py`, `pseo/templates/dashboard.html.j2`
- Test: `tests/test_dashboard.py`

**Interfaces:**
- Produces: `dashboard.render(conn, calculators, out_path: Path, now: datetime) -> Path` writes one self-contained HTML file (inline CSS and JS, no external requests) with tabs Overview, Content, Keywords, Indexing, Performance, plus a Formula Coverage table per calculator; client-side search and filter; Keywords tab has CSV export; Indexing tab states plainly that Google indexing cannot be forced and lists the manual-request queue; all data embedded as JSON and rendered with `textContent` (never `innerHTML`).

- [ ] **Step 1: Write failing tests** `test_dashboard_is_single_file_without_external_urls` (no `src="http` or `href="http` except links to the site's own pages), `test_dashboard_contains_all_five_tabs`, `test_dashboard_lists_held_pages_with_reason`, `test_dashboard_shows_calculator_without_formula_in_coverage`, `test_dashboard_escapes_hostile_keyword` (keyword `</script><img src=x onerror=alert(1)>` cannot break out of the embedded JSON), `test_dashboard_renders_with_empty_database`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement; embed JSON with `<` escaped as `<`.
- [ ] **Step 4:** Run; expect PASS
- [ ] **Step 5:** Commit `feat: private dashboard`

### Task 14: CLI and end-to-end run

**Files:**
- Create: `pseo/cli.py`
- Test: `tests/test_e2e.py`

**Interfaces:**
- Consumes: every stage
- Produces: console script `pseo` with subcommands `harvest, import <csv>, analyze, generate, qa, publish, ping, dashboard, run`; `pseo run` runs harvest, analyze, generate (includes qa), publish, ping, dashboard in order and prints a plain-English summary (new keywords, rejected, pages passed, held with reasons, pinged, dashboard path); flags `--db`, `--config`, `--out`, `--offline` (uses fixtures, no network); exit code 0 even when individual sources fail, 1 only on configuration errors with a message saying what to fix.

- [ ] **Step 1: Write failing test** `test_e2e_offline_run` (fixtures: 3 calculators, two with formulas; asserts at least one PUBLISHED page file exists, at least one HOLD page for the calculator without a formula, rejected keywords recorded with reasons, a pings log, a dashboard file, and the summary text contains each count); `test_second_run_changes_nothing` (row counts identical); `test_bad_config_exits_1_with_message`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement with `argparse`.
- [ ] **Step 4:** Run `pytest -q`; expect all tests PASS
- [ ] **Step 5:** Commit `feat: CLI and end-to-end pipeline`

### Task 15: Tier 2 and Tier 3 formulas

**Files:**
- Create: `pseo/formulas/tier2.py`, `pseo/formulas/tier3.py`
- Test: `tests/test_formulas_tier23.py`

**Interfaces:**
- Produces: registered formulas for Tier 2 (`percentage, fraction, ratio, average, tip, bill_split, age, date_difference, area, volume, unit_convert`) and Tier 3 (`bmi, bmr, tdee, ideal_weight, water_intake, due_date`), same `Formula` interface; health formulas set `category='health'` so the builder applies the medical note and approval flag; `config/calculators.yml` gains `formula_id` for each matched calculator.

- [ ] **Step 1: Write failing tests** known answers for each (e.g. `test_bmi_70kg_175cm` gives 22.86 within 0.01; `test_percentage_of`, `test_tip_split_rounding`, `test_age_leap_day`, `test_due_date_280_days`), `test_negative_height_raises_value_error`, `test_unit_convert_unknown_unit_raises`, `test_health_formulas_flag_category`
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Implement. Unknown calculators stay without `formula_id` and remain HOLD.
- [ ] **Step 4:** Run `pytest -q`; expect PASS
- [ ] **Step 5:** Commit `feat: tier 2 and tier 3 formulas`

### Task 16: GitHub Action, README and packaging

**Files:**
- Create: `.github/workflows/pseo.yml`, `README.md`, `.gitignore`
- Test: `tests/test_packaging.py`

**Interfaces:**
- Produces: workflow with `schedule` (weekly) and `workflow_dispatch`, installs the package, restores `data/pseo.db` from the repo, runs `pseo run`, commits drafts to branch `pseo-drafts`, opens a pull request, uploads `reports/dashboard.html` as an artifact; secrets `INDEXNOW_KEY`, `GSC_CREDENTIALS`, `SERPAPI_KEY` all optional; README has a five-step setup written for a non-coder (copy folder into repo, add secret, run workflow, open dashboard, review pull request) and a list of what each command does.

- [ ] **Step 1: Write failing tests** `test_workflow_yaml_parses_and_has_schedule_and_dispatch`, `test_workflow_does_not_publish_to_main` (no `git push origin main`), `test_readme_mentions_five_setup_steps`, `test_gitignore_excludes_reports_from_deploy`, `test_package_installs_entry_point` (`pseo --help` exits 0)
- [ ] **Step 2:** Run; expect FAIL
- [ ] **Step 3:** Write the files.
- [ ] **Step 4:** Run full suite `pytest -q`; expect all PASS; run `pseo run --offline --out /tmp/pseo-out` and open the dashboard to confirm it renders
- [ ] **Step 5:** Commit `feat: GitHub Action, README and packaging`; zip the project as `pseo-engine.zip`

---

## Self-Review

- **Spec coverage:** sections 4-6 → Tasks 1-4; 7 → 5-7; 8 → 12; 9 → 8, 9, 15; 10 → 10; 11 → 13; 12 → 14, 16; 13 → tests in every task; long-tail and numeric guard → 2, 6, 7; health rule → 9, 11, 15. No gaps found.
- **Type consistency:** `Calculator`, `Page`, `DataPoint`, `GateResult`, `Formula` are defined in Tasks 1, 9, 10, 8 and used with identical names later; `store.add_keyword` signature matches Tasks 3, 4.
- **Review Focus:** all five lines have a named test in the owning task (Tasks 3, 4, 8, 9, 10, 11, 12, 13).
- **Proportion:** plan lists signatures, test names and values only; no function bodies.
