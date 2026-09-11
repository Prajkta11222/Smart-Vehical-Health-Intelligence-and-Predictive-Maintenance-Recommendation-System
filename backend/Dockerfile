FROM python:3.12-slim

# Create a non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Install production deps only
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/app ./app
COPY drive-download-20260820T190522Z-1-001 /models
COPY flex_fuel_predictive_maintenance_dataset_augmented.csv /data/vehicle_dataset.csv

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
