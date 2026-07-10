FROM python:3.12-slim

WORKDIR /app

# Install dependencies first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Run ingestion -> cleaning -> exception detection once at container start,
# then launch the API. This keeps `docker-compose up` a true one-command setup.
CMD ["sh", "-c", "python3 -m app.services.ingestion_service && python3 -m app.services.cleaning_service && python3 -m app.services.exception_service && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

EXPOSE 8000
