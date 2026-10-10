import logging

from pseo import db, ping

HOST = "calculatepilot.com"
URLS = [f"https://calculatepilot.com/guides/p{i}.html" for i in range(3)]


def ok_post(url, payload):
    ok_post.calls.append(payload)
    return 200, "ok"


def fresh():
    ok_post.calls = []
    return db.connect(":memory:")


def test_indexnow_payload_shape():
    p = ping.indexnow_payload(URLS, HOST, "abc123")
    assert set(p) == {"host", "key", "keyLocation", "urlList"}
    assert p["keyLocation"] == "https://calculatepilot.com/abc123.txt" and p["urlList"] == URLS


def test_submit_batches_over_10000():
    c = fresh()
    urls = [f"https://calculatepilot.com/guides/p{i}.html" for i in range(10001)]
    assert ping.submit_indexnow(c, urls, HOST, "k", post=ok_post) == 10001
    assert [len(p["urlList"]) for p in ok_post.calls] == [10000, 1]


def test_submit_logs_status_codes():
    c = fresh()
    ping.submit_indexnow(c, URLS, HOST, "k", post=lambda u, p: (202, "accepted"))
    rows = c.execute("SELECT engine, status_code, response FROM pings").fetchall()
    assert len(rows) == 3 and {(r[0], r[1], r[2]) for r in rows} == {("indexnow", 202, "accepted")}


def test_submit_skips_already_pinged():
    c = fresh()
    ping.submit_indexnow(c, URLS[:2], HOST, "k", post=ok_post)
    assert ping.submit_indexnow(c, URLS, HOST, "k", post=ok_post) == 1
    assert ok_post.calls[-1]["urlList"] == [URLS[2]]


def test_submit_repings_after_republish():
    c = fresh()
    ping.submit_indexnow(c, URLS[:1], HOST, "k", post=ok_post)
    c.execute("INSERT INTO clusters(canonical_keyword) VALUES('x')")
    c.execute("INSERT INTO pages(cluster_id,slug,status,published_at) VALUES(1,'p0','PUBLISHED','2999-01-01')")
    assert ping.submit_indexnow(c, URLS[:1], HOST, "k", post=ok_post) == 1


def test_submit_failure_logged_not_raised():
    c = fresh()

    def boom(u, p):
        raise OSError("network down")

    assert ping.submit_indexnow(c, URLS, HOST, "k", post=boom) == 0
    rows = c.execute("SELECT status_code, response FROM pings").fetchall()
    assert len(rows) == 3 and rows[0][0] == 0 and "network down" in rows[0][1]
    # a failed URL is retried next time
    assert ping.submit_indexnow(c, URLS, HOST, "k", post=ok_post) == 3


def test_http_error_status_is_not_counted_as_success():
    c = fresh()
    assert ping.submit_indexnow(c, URLS, HOST, "k", post=lambda u, p: (403, "bad key")) == 0


def test_gsc_submit_without_credentials_returns_false_with_reason(caplog):
    c = fresh()
    with caplog.at_level(logging.WARNING):
        ok = ping.submit_gsc_sitemap(c, "https://calculatepilot.com/sitemap-guides.xml",
                                     "https://calculatepilot.com/", token_provider=lambda: None)
    assert ok is False and "credentials" in caplog.text.lower()


def test_gsc_submit_calls_endpoint_with_bearer_token():
    c = fresh()
    seen = {}

    def req(method, url, headers):
        seen.update(method=method, url=url, headers=headers)
        return 204

    assert ping.submit_gsc_sitemap(c, "https://calculatepilot.com/sitemap-guides.xml",
                                   "https://calculatepilot.com/", token_provider=lambda: "TOK", request=req)
    assert seen["method"] == "PUT" and seen["headers"]["Authorization"] == "Bearer TOK"
    assert "sites/https%3A%2F%2Fcalculatepilot.com%2F/sitemaps/" in seen["url"]
    assert c.execute("SELECT engine, status_code FROM pings").fetchone()[:] == ("gsc", 204)


def test_gsc_submit_http_failure_returns_false():
    c = fresh()
    assert ping.submit_gsc_sitemap(c, "https://x/s.xml", "https://x/", token_provider=lambda: "T",
                                   request=lambda m, u, h: 403) is False


def test_manual_queue_orders_by_score_limit_10():
    c = fresh()
    for i in range(12):
        cid = c.execute("INSERT INTO clusters(canonical_keyword) VALUES(?)", (f"k{i}",)).lastrowid
        c.execute("INSERT INTO scores(cluster_id,total) VALUES(?,?)", (cid, 50 + i))
        c.execute("INSERT INTO pages(cluster_id,slug,status,index_status) VALUES(?,?,?,?)",
                  (cid, f"s{i}", "PUBLISHED", "indexed" if i == 11 else None))
    c.execute("INSERT INTO clusters(canonical_keyword) VALUES('draft')")
    c.execute("INSERT INTO pages(cluster_id,slug,status) VALUES(13,'draft','DRAFT')")
    q = ping.manual_queue(c)
    assert len(q) == 10 and q[0].endswith("/guides/s10.html") and not any("s11" in u or "draft" in u for u in q)
    assert len(ping.manual_queue(c, limit=3)) == 3


def test_key_file_content_equals_key(tmp_path):
    p = ping.write_key_file("abc123", tmp_path)
    assert p.name == "abc123.txt" and p.read_text() == "abc123"
