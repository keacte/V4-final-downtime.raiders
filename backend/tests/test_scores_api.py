"""
Backend API tests for downtime.raiders
- GET /api/ health
- POST /api/scores validation + persistence
- GET /api/scores ordering, limit, _id exclusion
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://downtime-raiders.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"
        assert body.get("message") == "downtime.raiders online"


# ---------- POST /api/scores ----------
class TestSubmitScore:
    def test_submit_valid_score(self, client):
        payload = {"pilot": "TEST_pilot_alpha", "score": 1234, "wave": 3, "kills": 12}
        r = client.post(f"{API}/scores", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        # _id must not be in response
        assert "_id" not in data
        # required fields
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 0
        assert "timestamp" in data
        # pilot uppercased + trimmed
        assert data["pilot"] == "TEST_PILOT_ALPHA".upper()
        assert data["score"] == 1234
        assert data["wave"] == 3
        assert data["kills"] == 12

    def test_pilot_uppercased_and_truncated_to_24(self, client):
        long_name = "TEST_" + "a" * 50  # >24 chars
        r = client.post(f"{API}/scores", json={"pilot": long_name, "score": 10})
        assert r.status_code in (200, 422)
        # If pydantic max_length=24 rejects, we accept 422; otherwise verify trimming.
        if r.status_code == 200:
            data = r.json()
            assert len(data["pilot"]) <= 24
            assert data["pilot"] == data["pilot"].upper()

    def test_pilot_trimmed_whitespace(self, client):
        r = client.post(f"{API}/scores", json={"pilot": "   neo   ", "score": 5})
        assert r.status_code == 200, r.text
        assert r.json()["pilot"] == "NEO"

    def test_reject_empty_pilot(self, client):
        r = client.post(f"{API}/scores", json={"pilot": "", "score": 0})
        # Pydantic min_length=1 -> 422
        assert r.status_code in (400, 422)

    def test_reject_whitespace_only_pilot(self, client):
        # Pydantic min_length passes for "   ", but server strips -> 400
        r = client.post(f"{API}/scores", json={"pilot": "   ", "score": 0})
        assert r.status_code in (400, 422)

    def test_reject_negative_score(self, client):
        r = client.post(f"{API}/scores", json={"pilot": "TEST_neg", "score": -5})
        assert r.status_code == 422

    def test_reject_negative_wave(self, client):
        r = client.post(f"{API}/scores", json={"pilot": "TEST_w", "score": 1, "wave": 0})
        assert r.status_code == 422


# ---------- GET /api/scores ----------
class TestGetScores:
    def test_get_returns_top_sorted_desc(self, client):
        # Seed 3 scores
        seeds = [
            {"pilot": "TEST_low", "score": 10, "wave": 1, "kills": 1},
            {"pilot": "TEST_mid", "score": 500, "wave": 2, "kills": 5},
            {"pilot": "TEST_high", "score": 9999, "wave": 9, "kills": 50},
        ]
        for s in seeds:
            r = client.post(f"{API}/scores", json=s)
            assert r.status_code == 200

        r = client.get(f"{API}/scores")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) <= 10
        # _id excluded
        for row in data:
            assert "_id" not in row
            assert "id" in row
            assert "pilot" in row
            assert "score" in row
        # descending order
        scores = [row["score"] for row in data]
        assert scores == sorted(scores, reverse=True)
        # The highest seed should be present at top (or at least within first results)
        assert data[0]["score"] >= 9999

    def test_get_default_limit_10(self, client):
        r = client.get(f"{API}/scores")
        assert r.status_code == 200
        assert len(r.json()) <= 10

    def test_get_limit_param_respected(self, client):
        r = client.get(f"{API}/scores", params={"limit": 2})
        assert r.status_code == 200
        assert len(r.json()) <= 2

    def test_get_limit_clamped_high(self, client):
        # limit > 50 should clamp to 50, not error
        r = client.get(f"{API}/scores", params={"limit": 9999})
        assert r.status_code == 200
        assert len(r.json()) <= 50

    def test_get_limit_clamped_low(self, client):
        # limit < 1 should clamp to 1, not error
        r = client.get(f"{API}/scores", params={"limit": 0})
        assert r.status_code == 200
        assert len(r.json()) <= 1

    def test_create_then_get_persistence(self, client):
        unique_score = 7777777
        r = client.post(f"{API}/scores", json={"pilot": "TEST_persist", "score": unique_score, "wave": 5, "kills": 9})
        assert r.status_code == 200
        created = r.json()
        # Fetch top 50 and verify our score is there
        r = client.get(f"{API}/scores", params={"limit": 50})
        assert r.status_code == 200
        rows = r.json()
        match = [x for x in rows if x["id"] == created["id"]]
        assert len(match) == 1
        assert match[0]["pilot"] == "TEST_PERSIST"
        assert match[0]["score"] == unique_score
        assert match[0]["wave"] == 5
        assert match[0]["kills"] == 9
