from fastapi.testclient import TestClient

from app.main import app, health_status


def test_health_status_thresholds():
    assert health_status(95) == "Excellent"
    assert health_status(65) == "Good"
    assert health_status(45) == "Fair"
    assert health_status(20) == "Poor"
    assert health_status(19.99) == "Critical"


def test_health_endpoint():
    response = TestClient(app).get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["success"] is True
