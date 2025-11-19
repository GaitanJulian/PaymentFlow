# Payment Service (Python + FastAPI)

This microservice simulates a payment provider (Stripe/MercadoPago-style) and focuses on async processing, signed webhooks, and strong observability—making the architecture feel production-ready.

## Stack

- **Framework**: FastAPI (async) with typed routes, automatic OpenAPI docs, and dependency injection.
- **ORM & DB**: SQLModel or SQLAlchemy + PostgreSQL for transactions, idempotency keys, and audit logs. Alembic manages schema migrations.
- **Background Processing**: FastAPI `BackgroundTasks` for simple simulations or Celery / RQ with Redis for queue-backed retries.
- **Observability**: Structured JSON logging, `/health` + `/metrics`, and notes on adding OpenTelemetry tracing.

## Features

1. `POST /payments` accepts an `Idempotency-Key`, payment metadata, and schedules processing.
2. Background job simulates variability (latency, success/failure), retries failed attempts, and records results.
3. Once a payment decision is made, the service issues a signed webhook to the Order Service; HMAC signatures ensure authenticity.
4. Payment logs and idempotency records live in the payments database to ensure retries are safe and transparent.

## Testing & Quality

- `pytest` + `httpx.AsyncClient` for integration tests that hit the FastAPI app.
- Factories (e.g., `factory_boy` or `pydantic_factories`) create payment records for deterministic tests.
- Linters / formatters (Ruff, Black, isort) keep Python code consistent.

## Dev notes

1. Install dependencies with `pip install -r requirements.txt`.
2. Copy `.env.example` to `.env` and point `DATABASE_URL` to your PostgreSQL instance.
3. Run the app via `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.
4. Alembic migrations should point at `app.models` (stubbed so far) once you add scripts.
