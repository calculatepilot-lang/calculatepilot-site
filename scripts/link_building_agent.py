#!/usr/bin/env python3
"""
CalculatePilot autonomous link-building agent.

Runs daily via GitHub Actions (.github/workflows/link-building-agent.yml).
Each run:
  1. Searches a rotating set of query templates for resource-page /
     guest-post-friendly targets across ALL calculator categories —
     financial, health & fitness, math, and everyday — (via SerpApi).
  2. Skips domains already contacted (data/link_building_log.json).
  3. Fetches each candidate page, extracts a contact email.
  4. Drafts a personalized pitch (template, filled with the real page
     title/URL, and pointing to the 2-3 CalculatePilot tools most
     relevant to that page's own category — not generic boilerplate).
  5. Sends it via Gmail SMTP.
  6. Logs every attempt (contacted / no-email-found / skipped) so the
     log itself is the dedup source of truth and the audit trail.

Required secrets (GitHub Actions repo secrets):
  SERPAPI_KEY        - serpapi.com API key
  GMAIL_ADDRESS       - sending address (calculatepilot@gmail.com)
  GMAIL_APP_PASSWORD  - Gmail App Password (not the account password)

Rate limits are intentionally conservative to protect deliverability
and domain reputation: MAX_EMAILS_PER_RUN, one email per unique domain
ever (no follow-ups), and real per-target personalization.
"""
import json
import os
import random
import re
import smtplib
import time
from datetime import date, datetime, timezone
from email.mime.text import MIMEText
from urllib.parse import urlparse

import requests

LOG_PATH = "data/link_building_log.json"
MAX_EMAILS_PER_RUN = 6          # keep volume low — deliverability > volume
MAX_CANDIDATES_TO_CHECK = 40    # search results to evaluate per run
SITE_NAME = "CalculatePilot"
SITE_URL = "https://www.calculatepilot.com"
SENDER_NAME = "Suhaib Hassan"

# Query templates grouped by category so every category gets rotated
# through over time, not just finance.
QUERY_TEMPLATES_BY_CATEGORY = {
    "financial": [
        '"financial calculators" intitle:resources',
        'site:.edu "personal finance" "calculators" links',
        'site:.edu "financial literacy" "online calculators" resources',
        'site:.gov "financial education" "calculators" resources',
        'libguides "personal finance" "calculators" websites',
        'libguides "budgeting" "online tools" resources',
        '"student loan calculator" "helpful resources"',
        '"budgeting tools" "recommended resources"',
    ],
    "health": [
        '"fitness calculators" intitle:resources',
        'site:.edu "nutrition" "calculators" resources',
        'site:.edu "health and wellness" "online tools" resources',
        'site:.gov "healthy weight" "calculators" resources',
        'libguides "nutrition" "calculators" websites',
        'libguides "health sciences" "online calculators" resources',
        '"BMI calculator" "helpful resources"',
        '"calorie calculator" "recommended tools"',
    ],
    "math": [
        '"math resources" "calculators" links page',
        'site:.edu "math tools" resources links',
        'site:.edu "statistics" "online calculators" resources',
        'libguides "math" "calculators" websites',
        'libguides "mathematics" "online tools" resources',
        '"math teacher" "useful websites" resources',
        '"scientific calculator" "helpful resources"',
        '"free calculators" intitle:resources',
    ],
    "everyday": [
        '"everyday calculators" intitle:resources',
        'site:.edu "study tools" "grade calculator" resources',
        'libguides "student resources" "calculators" websites',
        'libguides "college" "GPA calculator" resources',
        '"date calculator" "helpful resources"',
        '"unit converter" "recommended tools"',
        '"free online tools" intitle:resources',
        '"useful online tools" "resources" links',
    ],
}
ALL_CATEGORIES = list(QUERY_TEMPLATES_BY_CATEGORY.keys())

# Pool of specific tool/guide pages per category (never category hubs).
# draft_email() picks 3 at random so outreach rotates across pages,
# including the long-tail pages we want to earn links to.
CATEGORY_EXAMPLE_LINKS = {
    "financial": [
        ("Mortgage payment calculator", f"{SITE_URL}/financial/mortgage-calculator.html"),
        ("Debt payoff calculator", f"{SITE_URL}/financial/debt-payoff-calculator.html"),
        ("Student loan calculator", f"{SITE_URL}/financial/student-loan-calculator.html"),
        ("Student loan guide", f"{SITE_URL}/guides/student-loan-guide.html"),
        ("Budget calculator", f"{SITE_URL}/financial/budget-calculator.html"),
        ("Compound interest calculator", f"{SITE_URL}/financial/compound-interest-calculator.html"),
        ("Savings goal calculator", f"{SITE_URL}/financial/savings-goal-calculator.html"),
        ("Emergency fund calculator", f"{SITE_URL}/financial/emergency-fund-calculator.html"),
        ("CD vs high-yield savings calculator", f"{SITE_URL}/financial/cd-vs-hysa-calculator.html"),
        ("Credit utilization calculator", f"{SITE_URL}/financial/credit-utilization-calculator.html"),
    ],
    "health": [
        ("BMI calculator", f"{SITE_URL}/health/bmi-calculator.html"),
        ("Calorie calculator", f"{SITE_URL}/health/calorie-calculator.html"),
        ("TDEE calculator", f"{SITE_URL}/health/tdee-calculator.html"),
        ("Macro calculator", f"{SITE_URL}/health/macro-calculator.html"),
        ("Steps to calories calculator", f"{SITE_URL}/health/steps-to-calories-calculator.html"),
        ("Pregnancy weight gain calculator", f"{SITE_URL}/health/pregnancy-weight-gain-calculator.html"),
        ("Healthy weight range calculator", f"{SITE_URL}/health/healthy-weight-range-calculator.html"),
        ("Protein calculator", f"{SITE_URL}/health/protein-calculator.html"),
    ],
    "math": [
        ("Scientific calculator", f"{SITE_URL}/math/scientific-calculator.html"),
        ("Percentage calculator", f"{SITE_URL}/math/percentage-calculator.html"),
        ("Quadratic formula calculator", f"{SITE_URL}/math/quadratic-formula-calculator.html"),
        ("Weighted average calculator", f"{SITE_URL}/math/weighted-average-calculator.html"),
        ("Fraction calculator", f"{SITE_URL}/math/fraction-calculator.html"),
        ("Standard deviation calculator", f"{SITE_URL}/math/standard-deviation-calculator.html"),
        ("Triangle calculator", f"{SITE_URL}/math/triangle-calculator.html"),
        ("Triangle calculator guide", f"{SITE_URL}/guides/triangle-calculator-guide.html"),
        ("Z-score calculator", f"{SITE_URL}/math/z-score-calculator.html"),
    ],
    "everyday": [
        ("Date calculator", f"{SITE_URL}/other/date-calculator.html"),
        ("GPA calculator", f"{SITE_URL}/other/gpa-calculator.html"),
        ("Final grade calculator", f"{SITE_URL}/other/grade-needed-calculator.html"),
        ("Age calculator", f"{SITE_URL}/other/age-calculator.html"),
        ("Tip calculator", f"{SITE_URL}/other/tip-calculator.html"),
        ("Unit and length converter", f"{SITE_URL}/other/conversion-calculator.html"),
        ("Flight time calculator", f"{SITE_URL}/other/flight-time-calculator.html"),
        ("Unit price calculator", f"{SITE_URL}/other/unit-price-calculator.html"),
    ],
}

CATEGORY_KEYWORDS = {
    "financial": ("financ", "budget", "loan", "mortgage", "debt", "invest", "tax", "retirement", "money"),
    "health": ("health", "fitness", "bmi", "calorie", "nutrition", "wellness", "weight", "body"),
    "math": ("math", "scientific", "triangle", "slope", "percentage", "algebra", "geometry"),
    "everyday": ("date", "gpa", "convert", "unit", "everyday", "productivity", "life hack"),
}

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
SKIP_EMAIL_DOMAINS = ("sentry.io", "wixpress.com", "example.com", "godaddy.com")

# Domains that will never place a resource link (social platforms, big
# publishers, freelance/PR marketplaces, Q&A/doc-sharing sites) and page
# titles that mark a page as a guest-post/outreach listicle, not a
# resource list. Matched against the domain and the page title.
BLOCKED_DOMAIN_PARTS = (
    "facebook.", "instagram.", "tiktok.", "reddit.", "quora.", "linkedin.",
    "youtube.", "pinterest.", "snapchat.", "twitter.", "wikipedia.",
    "scribd.", "slideserve.", "docsity.", "podcasts.apple.", "apps.apple.",
    "play.google.", "forbes.", "cnbc.", "usatoday.", "nerdwallet.",
    "upwork.", "fiverr.", "kwork.", "legiit.", "peopleperhour.",
    "prposting.", "outreachdesk.", "constant-content.", "feedspot.",
    "solarwinds.", "nvidia.", "developer.android.", "modelcontextprotocol.",
    "sciencedirect.", "mdpi.", "medium.", "substack.",
)
BLOCKED_TITLE_PARTS = (
    "guest post", "guest posting", "outreach software", "link building",
    "backlink", "write for us", "seo services", "sponsored post", "pr posting",
)


def is_blocked(dom, title=""):
    d = (dom or "").lower()
    if any(part in d for part in BLOCKED_DOMAIN_PARTS):
        return True
    t = (title or "").lower()
    return any(part in t for part in BLOCKED_TITLE_PARTS)


def load_log():
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH) as f:
            return json.load(f)
    return {"contacted_domains": [], "attempts": []}


def save_log(log):
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "w") as f:
        json.dump(log, f, indent=2)


def serpapi_search(query, api_key, num=10):
    resp = requests.get(
        "https://serpapi.com/search.json",
        params={"q": query, "num": num, "api_key": api_key, "engine": "google"},
        timeout=20,
    )
    resp.raise_for_status()
    return [r.get("link") for r in resp.json().get("organic_results", []) if r.get("link")]


def domain_of(url):
    return urlparse(url).netloc.replace("www.", "")


def fetch_page(url):
    try:
        r = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0 (compatible; CalculatePilotBot/1.0)"})
        if r.status_code == 200:
            return r.text
    except requests.RequestException:
        pass
    return None


def extract_email(html, base_domain):
    if not html:
        return None
    candidates = set(EMAIL_RE.findall(html))
    for e in candidates:
        d = e.split("@")[-1].lower()
        if any(bad in d for bad in SKIP_EMAIL_DOMAINS):
            continue
        return e
    return None


def extract_title(html, fallback):
    if html:
        m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
        if m:
            return re.sub(r"\s+", " ", m.group(1)).strip()[:120]
    return fallback


def detect_category(query_category, title, url):
    """The query template already targets a category, but the actual
    page content is the better signal when available — check title/url
    keywords first, fall back to the category the query was drawn from."""
    haystack = f"{title} {url}".lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in haystack for kw in keywords):
            return cat
    return query_category


def draft_email(page_title, page_url, category):
    pool = CATEGORY_EXAMPLE_LINKS.get(category, CATEGORY_EXAMPLE_LINKS["financial"])
    examples = random.sample(pool, k=min(3, len(pool)))
    example_lines = "\n".join(f"- {name}: {link}" for name, link in examples)
    subject = f"Free calculator resource for your \"{page_title}\" page"
    body = f"""Hi,

I came across your page here: {page_url}

I run {SITE_NAME} ({SITE_URL}), a free calculator platform — 158+ tools across finance, health, math, and everyday decisions, no ads or signup required. It looked like a fit alongside the resources you've already linked there.

A few that might be relevant:
{example_lines}

No obligation at all — just flagging it in case it's useful for your readers. Happy to answer anything about the tools.

Best,
{SENDER_NAME}
{SITE_NAME} — {SITE_URL}
"""
    return subject, body


def send_email(to_addr, subject, body, gmail_address, gmail_app_password):
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = f"{SENDER_NAME} <{gmail_address}>"
    msg["To"] = to_addr
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(gmail_address, gmail_app_password)
        server.sendmail(gmail_address, [to_addr], msg.as_string())


def main():
    serpapi_key = os.environ["SERPAPI_KEY"]
    gmail_address = os.environ["GMAIL_ADDRESS"]
    gmail_app_password = os.environ["GMAIL_APP_PASSWORD"]

    log = load_log()
    contacted = set(log["contacted_domains"])

    # Pull from every category each run (not just one) so financial,
    # health, math, and everyday all get steady coverage over time.
    candidates = []  # list of (url, category)
    for cat in ALL_CATEGORIES:
        queries = random.sample(
            QUERY_TEMPLATES_BY_CATEGORY[cat],
            k=min(2, len(QUERY_TEMPLATES_BY_CATEGORY[cat])),
        )
        for q in queries:
            try:
                urls = serpapi_search(q, serpapi_key, num=10)
            except Exception as e:
                log["attempts"].append({"time": datetime.now(timezone.utc).isoformat(), "query": q, "category": cat, "error": str(e)})
                continue
            candidates.extend((u, cat) for u in urls)
    random.shuffle(candidates)
    # Prefer university/library/government resource pages, then the rest.
    candidates.sort(key=lambda c: 0 if re.search(r"\.(edu|gov)(/|$)|libguides|library|libraries|researchguides", c[0]) else 1)
    candidates = candidates[:MAX_CANDIDATES_TO_CHECK]

    sent = 0
    for url, query_category in candidates:
        if sent >= MAX_EMAILS_PER_RUN:
            break
        dom = domain_of(url)
        if not dom or dom in contacted or "calculatepilot" in dom:
            continue
        if is_blocked(dom):
            continue

        html = fetch_page(url)
        email = extract_email(html, dom)
        title = extract_title(html, dom)
        if is_blocked(dom, title):
            attempt = {"time": datetime.now(timezone.utc).isoformat(), "url": url, "domain": dom, "title": title, "status": "skipped-blocked"}
            log["attempts"].append(attempt)
            contacted.add(dom)
            continue
        category = detect_category(query_category, title, url)
        attempt = {
            "time": datetime.now(timezone.utc).isoformat(),
            "url": url,
            "domain": dom,
            "title": title,
            "category": category,
        }

        if not email:
            attempt["status"] = "no-email-found"
            log["attempts"].append(attempt)
            contacted.add(dom)  # don't re-check the same domain every run
            continue

        subject, body = draft_email(title, url, category)
        try:
            send_email(email, subject, body, gmail_address, gmail_app_password)
            attempt["status"] = "sent"
            attempt["email"] = email
            attempt["subject"] = subject
            sent += 1
        except Exception as e:
            attempt["status"] = "send-failed"
            attempt["error"] = str(e)

        log["attempts"].append(attempt)
        contacted.add(dom)
        time.sleep(8)  # space sends out — avoid burst-send spam signatures

    log["contacted_domains"] = sorted(contacted)
    log["last_run"] = datetime.now(timezone.utc).isoformat()
    log["last_run_sent_count"] = sent
    save_log(log)
    print(f"Run complete. Sent {sent} emails. Total domains contacted: {len(contacted)}.")


if __name__ == "__main__":
    main()
