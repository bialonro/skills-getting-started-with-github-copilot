import pytest
from fastapi.testclient import TestClient

from src.app import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.mark.parametrize(
    ("method", "url"),
    [
        ("POST", "/activities/Chess Club/signup"),
        ("DELETE", "/activities/Chess Club/participants"),
    ],
)
def test_activity_mutations_require_email(client, method, url):
    response = client.request(method, url)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["query", "email"]
