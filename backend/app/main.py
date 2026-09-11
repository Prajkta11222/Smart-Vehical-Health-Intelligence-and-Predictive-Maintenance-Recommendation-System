from contextlib import asynccontextmanager
from pathlib import Path
import json
import logging
import os
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select

from .db.database import DATABASE_URL, engine, initialize_database, session_scope
from .db.models import Prediction

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("vehicle-health")

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MODEL_DIR = ROOT / "drive-download-20260820T190522Z-1-001"
MODEL_DIR = Path(os.getenv("MODEL_DIR", str(DEFAULT_MODEL_DIR)))
DEFAULT_DATASET_PATH = ROOT / "flex_fuel_predictive_maintenance_dataset_augmented.csv"
DATASET_PATH = os.getenv("DATASET_PATH", str(DEFAULT_DATASET_PATH) if DEFAULT_DATASET_PATH.exists() else "")

NUMERIC_FEATURES = [
    "Vehicle_Age_years", "Engine_Size_cc", "Ambient_Temperature_C", "Humidity_Pct", "Altitude_m",
    "Ethanol_Content_Pct", "Fuel_Consumption_Rate_L_100km", "Fuel_Rail_Pressure_kPa", "Injector_Duty_Cycle_Pct",
    "Fuel_Water_Contamination_ppm", "LTFT_Pct", "STFT_Pct", "Oil_Pressure_psi", "Oil_Temperature_C",
    "Coolant_Temperature_C", "Vibration_Level_mm_s", "Knock_Sensor_Level", "Exhaust_Gas_Temperature_C",
    "RPM_Avg", "Idle_RPM_StdDev", "AFR_Lambda", "MAP_kPa", "Engine_Load_Pct", "Compression_Ratio_Change_Pct",
    "Total_Mileage_km", "Engine_Run_Hours", "Idle_Time_Pct", "Avg_Load_Pct", "Harsh_Event_Count_per_trip",
    "Blend_Switch_Frequency_per_month", "Avg_Trip_Length_km", "Injector_Flow_Drift_Pct", "Misfire_Count_per_1000rev",
    "Spark_Plug_Wear_mm", "Fuel_Pump_Current_A", "Fuel_Pump_Pressure_Decay_kPa_min", "Catalytic_Converter_Efficiency_Pct",
    "Fuel_System_Corrosion_Score", "O2_Sensor_Response_ms", "Cold_Start_Duration_s", "Cranking_Voltage_V",
    "Time_Since_Last_Service_days", "Time_Since_Injector_Replacement_km", "Time_Since_SparkPlug_Replacement_km",
]
CATEGORICAL_FEATURES = [
    "Vehicle_Model", "Fuel_System_Material_Compatibility", "Climate_Region", "Fuel_Vapor_Pressure_Class",
    "Towing_Flag", "Driving_Pattern", "Fuel_Line_Seal_Condition",
]
RAW_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

class VehicleParameters(BaseModel):
    model_config = ConfigDict(extra="forbid")
    Vehicle_Model: str = "Car"
    Fuel_System_Material_Compatibility: str = "Standard"
    Climate_Region: str = "Temperate"
    Fuel_Vapor_Pressure_Class: str = "Class 2"
    Towing_Flag: bool = False
    Driving_Pattern: str = "Mixed"
    Fuel_Line_Seal_Condition: str = "Pass"
    values: dict[str, float | None] = Field(default_factory=dict)

class PredictionRequest(VehicleParameters):
    vehicle_id: str | None = None

class ArtifactStore:
    model: Any = None
    preprocessor: Any = None
    health: pd.DataFrame | None = None
    recommendations: pd.DataFrame | None = None
    shap_global: pd.DataFrame | None = None
    raw_data: pd.DataFrame | None = None
    raw_data_indexed: pd.DataFrame | None = None
    vehicles_df: pd.DataFrame | None = None
    metadata: dict[str, Any] = {}
    error: str | None = None

store = ArtifactStore()

def load_artifacts() -> None:
    try:
        model_path = MODEL_DIR / "final_selected_model.joblib"
        preprocessor_path = MODEL_DIR / "rf_xgb_preprocessor.joblib"
        if not model_path.exists() or not preprocessor_path.exists():
            raise FileNotFoundError("final_selected_model.joblib and rf_xgb_preprocessor.joblib are required in MODEL_DIR")
        store.model = joblib.load(model_path)
        store.preprocessor = joblib.load(preprocessor_path)
        for name, attr in [
            ("vehicle_health_scores.joblib", "health"),
            ("vehicle_recommendations.joblib", "recommendations"),
            ("shap_feature_importance.joblib", "shap_global"),
        ]:
            path = MODEL_DIR / name
            if path.exists():
                setattr(store, attr, joblib.load(path))

        metadata_paths = [
            MODEL_DIR / "model_information.json",
            ROOT / "drive-download-20260820T191405Z-1-001" / "model_information.json",
        ]
        loaded_json_meta = False
        for mp in metadata_paths:
            if mp.exists():
                try:
                    store.metadata = json.loads(mp.read_text(encoding="utf-8"))
                    loaded_json_meta = True
                    break
                except Exception:
                    pass

        if not loaded_json_meta:
            joblib_meta_path = MODEL_DIR / "final_model_metadata.joblib"
            if joblib_meta_path.exists():
                raw_meta = joblib.load(joblib_meta_path)
                if isinstance(raw_meta, dict):
                    meta_dict = {}
                    for k, v in raw_meta.items():
                        val = float(v) if hasattr(v, "item") else v
                        meta_dict[k] = val
                        norm_k = k.lower().replace(" ", "_").replace("-", "_")
                        meta_dict[norm_k] = val
                    store.metadata = meta_dict
                else:
                    store.metadata = {"final_model": str(raw_meta)}

        if DATASET_PATH and Path(DATASET_PATH).exists():
            store.raw_data = pd.read_csv(DATASET_PATH)
            if "Vehicle_ID" in store.raw_data.columns:
                store.raw_data_indexed = store.raw_data.set_index("Vehicle_ID", drop=False)

        if store.health is not None:
            v_frame = store.health.copy()
            v_frame["Vehicle_ID"] = v_frame["Vehicle_Index"].map(lambda val: f"FFV2-{int(val):06d}")
            if store.raw_data is not None and "Vehicle_ID" in store.raw_data.columns:
                meta_cols = ["Vehicle_ID"] + [c for c in ["Vehicle_Model", "Vehicle_Age_years", "Total_Mileage_km"] if c in store.raw_data.columns]
                raw_meta = store.raw_data[meta_cols].drop_duplicates(subset=["Vehicle_ID"])
                v_frame = v_frame.merge(raw_meta, on="Vehicle_ID", how="left")
                if "Vehicle_Model" in v_frame.columns:
                    v_frame = v_frame[v_frame["Vehicle_Model"].notna()]
            v_frame = v_frame.where(pd.notnull(v_frame), None)
            store.vehicles_df = v_frame

        logger.info("Loaded ML artifacts from %s", MODEL_DIR)
    except Exception as exc:
        store.error = str(exc)
        logger.exception("ML artifacts unavailable")

def health_status(score: float) -> str:
    return "Excellent" if score >= 80 else "Good" if score >= 60 else "Fair" if score >= 40 else "Poor" if score >= 20 else "Critical"

def frame_from_request(request: PredictionRequest) -> pd.DataFrame:
    missing = [feature for feature in NUMERIC_FEATURES if feature not in request.values]
    if missing:
        raise ValueError(f"Missing raw numeric features: {', '.join(missing)}")
    row = {feature: request.values[feature] for feature in NUMERIC_FEATURES}
    row.update({feature: getattr(request, feature) for feature in CATEGORICAL_FEATURES})
    return pd.DataFrame([row], columns=RAW_FEATURES)

def envelope(data: Any = None, error: dict | None = None, meta: dict | None = None) -> dict:
    return {"success": error is None, "data": data, "error": error, "meta": meta or {}}

@asynccontextmanager
async def lifespan(_: FastAPI):
    load_artifacts()
    try:
        initialize_database()
    except Exception:
        logger.exception("Database unavailable; continuing without persistence")
    yield

app = FastAPI(title="Smart Vehicle Health Intelligence API", version="1.0.0", lifespan=lifespan)
origins = [item.strip().rstrip("/") for item in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if item.strip()]
frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/v1/health")
def api_health():
    db_status = "connected" if engine is not None else "disabled"
    db_type = "postgresql" if "postgres" in (DATABASE_URL or "") else "sqlite" if "sqlite" in (DATABASE_URL or "") else "disabled"
    return envelope({
        "status": "healthy" if not store.error else "degraded",
        "artifacts_loaded": store.error is None,
        "database": db_status,
        "database_type": db_type,
        "model": store.metadata.get("final_model", "Random Forest"),
    })

@app.get("/api/v1/dashboard/summary")
def dashboard_summary():
    if store.health is None:
        raise HTTPException(503, detail="Health score artifact is unavailable")
    frame = store.health
    counts = frame["Health_Status"].value_counts().to_dict()
    return envelope({
        "total_vehicles": len(frame),
        "average_health_score": round(float(frame.Vehicle_Health_Score.mean()), 2),
        "maintenance_required": int(frame.Predicted_Need_Maintenance.sum()),
        "health_distribution": counts,
        "model": store.metadata.get("final_model", "Random Forest"),
    })

@app.get("/api/v1/vehicles")
def vehicles(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), search: str = ""):
    if store.vehicles_df is not None:
        frame = store.vehicles_df
    elif store.health is not None:
        frame = store.health.copy()
        frame["Vehicle_ID"] = frame["Vehicle_Index"].map(lambda value: f"FFV2-{int(value):06d}")
    else:
        raise HTTPException(503, detail="Vehicle artifact is unavailable")
    if search:
        frame = frame[frame.Vehicle_ID.str.contains(search, case=False)]
    start = (page - 1) * page_size
    total_count = len(frame)
    records = frame.iloc[start:start + page_size].to_dict(orient="records")
    sanitized = [{k: (None if isinstance(v, float) and (v != v or pd.isna(v)) else v) for k, v in row.items()} for row in records]
    return envelope(sanitized, meta={"page": page, "page_size": page_size, "total": total_count})

@app.post("/api/v1/predict")
def predict(request: PredictionRequest):
    if store.error or store.model is None or store.preprocessor is None:
        raise HTTPException(503, detail="ML artifacts are unavailable; configure MODEL_DIR with the matching model and preprocessor")
    try:
        transformed = store.preprocessor.transform(frame_from_request(request))
        probability = float(store.model.predict_proba(transformed)[0][1])
        score = max(0.0, min(100.0, (1.0 - probability) * 100.0))
        result = {"prediction": "Yes" if probability >= 0.5 else "No", "probability_yes": probability, "confidence": max(probability, 1 - probability), "health_score": round(score, 2), "health_status": health_status(score)}
        with session_scope() as session:
            if session is not None:
                session.add(Prediction(vehicle_id=request.vehicle_id, prediction_status=result["prediction"], probability_yes=probability, health_score=score, input_parameters=request.model_dump()))
        return envelope(result)
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(422, detail="The supplied vehicle parameters could not be evaluated") from exc

@app.get("/api/v1/shap/global")
def shap_global():
    if store.shap_global is None:
        raise HTTPException(503, detail="SHAP artifact is unavailable")
    data = store.shap_global.to_dict(orient="records") if isinstance(store.shap_global, pd.DataFrame) else store.shap_global
    return envelope(data)

@app.get("/api/v1/shap/dependence")
def shap_dependence():
    return shap_global()

@app.get("/api/v1/vehicles/{vehicle_id}/health-score")
def vehicle_health_score(vehicle_id: str):
    result = vehicle(vehicle_id)
    return envelope({"vehicle_id": vehicle_id, "health_score": result["data"]["Vehicle_Health_Score"], "health_status": result["data"]["Health_Status"]})

@app.get("/api/v1/vehicles/{vehicle_id}/shap")
def vehicle_shap(vehicle_id: str):
    return shap_global()

@app.get("/api/v1/predictions/history")
def prediction_history(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100)):
    with session_scope() as session:
        if session is None:
            return envelope([], meta={"page": page, "page_size": page_size, "total": 0, "persistence": "disabled"})
        total_count = session.scalar(select(func.count(Prediction.id))) or 0
        rows = session.scalars(select(Prediction).order_by(Prediction.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
        data = [{"id": row.id, "vehicle_id": row.vehicle_id, "prediction": row.prediction_status, "probability_yes": row.probability_yes, "health_score": row.health_score, "created_at": row.created_at.isoformat()} for row in rows]
        return envelope(data, meta={"page": page, "page_size": page_size, "total": total_count})

@app.get("/api/v1/predictions")
def predictions(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100)):
    return prediction_history(page, page_size)

@app.get("/api/v1/model/info")
def model_info():
    return envelope(store.metadata)

@app.get("/api/v1/dataset/summary")
def dataset_summary():
    return envelope({"records": 120000, "original_features": 56, "numeric_features": 45, "categorical_features": 11, "duplicates": 0, "target": {"No": 60833, "Yes": 59167}})

@app.get("/api/v1/vehicles/{vehicle_id}")
def vehicle(vehicle_id: str):
    if store.health is None:
        raise HTTPException(503, detail="Vehicle artifact is unavailable")
    try:
        index = int(vehicle_id.split("-")[-1])
        match = store.health[store.health.Vehicle_Index == index]
        if match.empty:
            raise ValueError
        result = match.iloc[0].to_dict()
        result["Vehicle_ID"] = vehicle_id
        if store.raw_data_indexed is not None and vehicle_id in store.raw_data_indexed.index:
            raw_entry = store.raw_data_indexed.loc[vehicle_id]
            if isinstance(raw_entry, pd.DataFrame):
                raw_entry = raw_entry.iloc[0]
            result["raw_values"] = {feature: (None if pd.isna(raw_entry[feature]) else raw_entry[feature].item() if hasattr(raw_entry[feature], "item") else raw_entry[feature]) for feature in NUMERIC_FEATURES if feature in raw_entry}
            result["raw_categories"] = {feature: (raw_entry[feature].item() if hasattr(raw_entry[feature], "item") else raw_entry[feature]) for feature in CATEGORICAL_FEATURES if feature in raw_entry}
            if "Vehicle_Model" in raw_entry:
                result["Vehicle_Model"] = str(raw_entry["Vehicle_Model"])
            if "Total_Mileage_km" in raw_entry:
                result["Total_Mileage_km"] = float(raw_entry["Total_Mileage_km"])
        sanitized = {k: (None if isinstance(v, float) and (v != v or pd.isna(v)) else v) for k, v in result.items()}
        return envelope(sanitized)
    except (ValueError, IndexError):
        raise HTTPException(404, detail="Vehicle not found")

@app.get("/api/v1/vehicles/{vehicle_id}/recommendations")
def vehicle_recommendations(vehicle_id: str):
    if store.recommendations is None:
        raise HTTPException(503, detail="Recommendation artifact is unavailable")
    index = int(vehicle_id.split("-")[-1])
    match = store.recommendations[store.recommendations.Vehicle_Index == index]
    return envelope(match.to_dict(orient="records"))
