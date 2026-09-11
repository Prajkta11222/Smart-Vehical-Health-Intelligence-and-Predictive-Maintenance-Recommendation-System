import pytest
from fastapi.testclient import TestClient
from app.main import app, store, load_artifacts

@pytest.fixture(scope="session", autouse=True)
def setup_artifacts():
    load_artifacts()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_api_health(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert data["data"]["artifacts_loaded"] is True

def test_dashboard_summary(client):
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total_vehicles"] > 0
    assert "average_health_score" in data
    assert "maintenance_required" in data
    assert "health_distribution" in data

def test_vehicles_list(client):
    res = client.get("/api/v1/vehicles?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) == 10
    first = data["data"][0]
    assert "Vehicle_ID" in first
    assert "Vehicle_Health_Score" in first

def test_vehicle_detail(client):
    res = client.get("/api/v1/vehicles/FFV2-000000")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "Vehicle_Health_Score" in data
    assert "Health_Status" in data

def test_vehicle_health_score(client):
    res = client.get("/api/v1/vehicles/FFV2-000000/health-score")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["vehicle_id"] == "FFV2-000000"
    assert "health_score" in data

def test_vehicle_recommendations(client):
    res = client.get("/api/v1/vehicles/FFV2-000000/recommendations")
    assert res.status_code == 200
    data = res.json()["data"]
    assert isinstance(data, list)

def test_shap_global(client):
    res = client.get("/api/v1/shap/global")
    assert res.status_code == 200
    data = res.json()["data"]
    assert isinstance(data, list)
    assert len(data) > 0
    assert "Feature" in data[0]
    assert "Mean_Absolute_SHAP" in data[0]

def test_shap_dependence(client):
    res = client.get("/api/v1/shap/dependence")
    assert res.status_code == 200
    data = res.json()["data"]
    assert isinstance(data, list)

def test_model_info(client):
    res = client.get("/api/v1/model/info")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "Final Model" in data or "final_model" in data

def test_dataset_summary(client):
    res = client.get("/api/v1/dataset/summary")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["records"] > 0
    assert "target" in data

def test_predictions_history(client):
    res = client.get("/api/v1/predictions/history")
    assert res.status_code == 200
    assert res.json()["success"] is True

def test_predict_endpoint(client):
    # Sample real feature dict
    from app.main import NUMERIC_FEATURES
    sample_values = {feat: 50.0 for feat in NUMERIC_FEATURES}
    payload = {
        "vehicle_id": "FFV2-999999",
        "Vehicle_Model": "Car",
        "Fuel_System_Material_Compatibility": "Standard",
        "Climate_Region": "Temperate",
        "Fuel_Vapor_Pressure_Class": "Class 2",
        "Towing_Flag": False,
        "Driving_Pattern": "Mixed",
        "Fuel_Line_Seal_Condition": "Pass",
        "values": sample_values
    }
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "prediction" in data
    assert "probability_yes" in data
    assert "health_score" in data
    assert "health_status" in data

def test_database_persistence(client):
    from app.main import NUMERIC_FEATURES
    unique_vid = "FFV2-TEST-PERSIST"
    payload = {
        "vehicle_id": unique_vid,
        "Vehicle_Model": "SUV",
        "Fuel_System_Material_Compatibility": "Standard",
        "Climate_Region": "Temperate",
        "Fuel_Vapor_Pressure_Class": "Class 2",
        "Towing_Flag": False,
        "Driving_Pattern": "Mixed",
        "Fuel_Line_Seal_Condition": "Pass",
        "values": {feat: 55.0 for feat in NUMERIC_FEATURES}
    }
    pred_res = client.post("/api/v1/predict", json=payload)
    assert pred_res.status_code == 200

    hist_res = client.get("/api/v1/predictions/history?page=1&page_size=25")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()["data"]
    matched = [item for item in hist_data if item.get("vehicle_id") == unique_vid]
    assert len(matched) >= 1
    assert matched[0]["prediction"] in ["Yes", "No"]
    assert "health_score" in matched[0]
