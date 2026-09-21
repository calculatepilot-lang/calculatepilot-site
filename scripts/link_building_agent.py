#!/usr/bin/env python3
"""
CalculatePilot autonomous link-building agent.

Runs weekly via GitHub Actions (.github/workflows/link-building-agent.yml).
Each run:
  1. Searches a rotating set of query templates for resource-page /
     guest-post-friendly targets (via SerpApi).
  2. Skips domains already contacted (data/link_building_log.json).
  3. Fetches each candidate page, extracts a contact email.
  4. Drafts a personalized pitch (template, filled with the real page
     title/URL — not generic boilerplate).
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
from datetime import datetime, timezone
from email.mime.text import MIMEText
from urllib.parse import urlparse

import requests

LOG_PATH = "data/link_building_log.json"
MAX_EMAILS_PER_RUN = 6          # keep volume low — deliverability > volume
MAX_CANDIDATES_TO_CHECK = 40    # search results to evaluate per run
SITE_NAME = "CalculatePilot"
SITE_URL = "https://www.calculatepilot.com"
SENDER_NAME = "Suhaib Hassan"

QUERY_TEMPLATES = [
    '"financial calculators" intitle:resources',
    '"useful tools" "budgeting" inurl:resources',
    'site:.edu "personal finance" "calculators" links',
    '"student loan calculator" "helpful resources"',
    '"personal finance" "write for us"',
    'inurl:guest-post "personal finance"',
    '"math resources" "calculators" links page',
    '"free calculators" intitle:resources',
    '"budgeting tools" "recommended resources"',
    '"contribute" "personal finance blog"',
]

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
SKIP_EMAIL_DOMAINS = ("sentry.io", "wixpress.com", "example.com", "godaddy.com")


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


def draft_email(page_title, page_url):
    subject = f"Free calculator resource for your \"{page_title}\" page"
    body = f"""Hi,

I came across your page here: {page_url}

I run {SITE_NAME} ({SITE_URL}), a free calculator platform — 158+ tools across finance, health, math, and everyday decisions, no ads or signup required. It looked like a fit alongside the resources you've already linked there.

A few that might be relevant:
- Mortgage & loan payment calculator: {SITE_URL}/financial/mortgage-calculator.html
- Debt payoff calculator: {SITE_URL}/financial/debt-payoff-calculator.html
- Student loan calculator: {SITE_URL}/guides/student-loan-guide.html

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

    queries = random.sample(QUERY_TEMPLATES, k=min(4, len(QUERY_TEMPLATES)))
    candidates = []
    for q in queries:
        try:
            urls = serpapi_search(q, serpapi_key, num=10)
        except Exception as e:
            log["attempts"].append({"time": datetime.now(timezone.utc).isoformat(), "query": q, "error": str(e)})
            continue
        candidates.extend(urls)
        if len(candidates) >= MAX_CANDIDATES_TO_CHECK:
            break

    sent = 0
    for url in candidates:
        if sent >= MAX_EMAILS_PER_RUN:
            break
        dom = domain_of(url)
        if not dom or dom in contacted or "calculatepilot" in dom:
            continue

        html = fetch_page(url)
        email = extract_email(html, dom)
        title = extract_title(html, dom)
        attempt = {
            "time": datetime.now(timezone.utc).isoformat(),
            "url": url,
            "domain": dom,
            "title": title,
        }

        if not email:
            attempt["status"] = "no-email-found"
            log["attempts"].append(attempt)
            contacted.add(dom)  # don't re-check the same domain every week
            continue

        subject, body = draft_email(title, url)
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
