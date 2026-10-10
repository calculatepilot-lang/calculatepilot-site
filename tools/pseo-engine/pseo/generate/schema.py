"""JSON-LD built only from content that is also visible on the page."""
from __future__ import annotations

import json


def _safe(obj) -> str:
    """json.dumps with <, > and & escaped so the block can never close its own script tag."""
    return (json.dumps(obj, ensure_ascii=True)
            .replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026"))


def jsonld(page, url: str) -> str:
    graph = [{
        "@type": "Article",
        "headline": page.h1,
        "description": page.description,
        "author": {"@type": "Person", "name": page.author},
        "datePublished": page.date_iso,
        "dateModified": page.date_iso,
        "mainEntityOfPage": url,
    }]
    if page.faq:
        graph.append({
            "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": q,
                            "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in page.faq],
        })
    graph.append({
        "@type": "BreadcrumbList",
        "itemListElement": [{"@type": "ListItem", "position": i, "name": name, "item": link}
                            for i, (name, link) in enumerate(page.breadcrumbs, 1)],
    })
    return _safe({"@context": "https://schema.org", "@graph": graph})
