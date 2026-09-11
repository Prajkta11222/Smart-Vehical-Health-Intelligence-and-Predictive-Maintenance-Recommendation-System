# API

All responses use `{ success, data, error, meta }`.

- `GET /api/v1/health`: service and artifact availability
- `GET /api/v1/dashboard/summary`: fleet totals and health distribution
- `GET /api/v1/vehicles?page=1&page_size=25&search=`: paginated vehicle scores
- `GET /api/v1/vehicles/{vehicle_id}`: one exported vehicle score
- `POST /api/v1/predict`: validates parameters and runs the saved model
- `GET /api/v1/vehicles/{vehicle_id}/recommendations`: exported recommendations
- `GET /api/v1/shap/global`: global SHAP importance artifact
- `GET /api/v1/model/info`: saved model metadata
- `GET /api/v1/dataset/summary`: dataset metadata

Prediction request values are supplied in the `values` object using the 44 numeric feature names from `preprocessing_metadata.json`; categorical fields are top-level fields on the request. The API returns `prediction`, `probability_yes`, `confidence`, `health_score`, and `health_status`.
