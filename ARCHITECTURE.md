# Architecture

```mermaid
flowchart LR
  UI[React TypeScript frontend] --> API[FastAPI /api/v1]
  API --> ML[Artifact-backed ML service]
  ML --> RF[Final Random Forest]
  ML --> SHAP[SHAP artifacts]
  API --> DATA[Health and recommendation exports]
```

The browser owns presentation and navigation. FastAPI owns validation, artifact loading, prediction, score calculation, and API envelopes. ML artifacts are loaded once during application lifespan. No training is performed during requests. PostgreSQL can be introduced for prediction history and audit records without placing large ML matrices in the database.
