FROM python:3.12-slim-bookworm AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONPATH=/app

WORKDIR /app

RUN set -e; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        curl \
        libpq-dev; \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN set -e; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        gcc \
        python3-dev; \
    pip install --no-cache-dir -r requirements.txt; \
    apt-get purge -y --auto-remove gcc python3-dev; \
    rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]