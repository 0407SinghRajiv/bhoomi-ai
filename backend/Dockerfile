FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Default environment variables
ENV ENVIRONMENT=production \
    DATABASE_URL=sqlite:///./bhoomiai.db \
    CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Run migrations and start server
CMD alembic upgrade head && python app/seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000
