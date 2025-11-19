# PaymentFlow

Polyglot microservice portfolio that showcases a Node.js/TypeScript Order Service coordinating with a FastAPI-based Payment Provider through signed webhooks, background jobs, and PostgreSQL-backed persistence. The stack demonstrates asynchronous workflows, multi-language ecosystems, and observability patterns that recruiters look for in senior backend profiles.

## Architecture

- **Order Service (Node.js + TypeScript + Prisma + PostgreSQL)**  
  * Manages the order lifecycle (`PENDING → PAID → FAILED → CANCELED → SHIPPED`).  
  * Exposes a REST API (Express, Fastify, or NestJS) with JWT authentication, access/refresh tokens, and role-based access (USER / ADMIN).  
  * Owns the orders database and publishes `order.created` / `payment.*` events (initially via HTTP, extensible to RabbitMQ or Kafka).  

- **Payment Service (Python + FastAPI + SQLModel/SQLAlchemy + PostgreSQL)**  
  * Acts as a fake payment provider simulating successes/failures with latency, retries, and background processing (BackgroundTasks or Celery/RQ + Redis).  
  * Receives `POST /payments` with idempotency keys, stores transaction logs, and triggers signed webhooks (`SIGNING_SECRET`) back to the Order Service.  
  * Includes `/health` and `/metrics` endpoints, structured JSON logging, and observability hooks (correlation IDs, OpenTelemetry notes).

- **Infrastructure Extras**  
  * Docker Compose orchestrates both services with PostgreSQL (orders/payments), Redis/RabbitMQ, and shared networks.  
  * CI pipeline (GitHub Actions) runs linters (ESLint/Prettier, Ruff/Black), Jest/Supertest, pytest+HTTPX, and builds Docker images.  
  * Optional React/Vite dashboard can visualize orders, payments, and status timelines.

## Getting started

1. Read the service-specific guides below to understand their responsibilities and tech choices.
2. Spin up the stack with `docker-compose -f dev/docker-compose.yml up --build` (or `make up` / `npm run dev:stack` when scripts are added).
3. Run linters/tests inside each service (`npm test` / `pytest`) and inspect endpoints via Swagger/OpenAPI docs.

Each service resides in its own folder to keep code, migrations, and tests self-contained while still delivering a connected system.

## Service Guides

- [`order-service/README.md`](order-service/README.md) — outlines the Node.js journey: API, events, JWT security, Prisma models, and testing strategy.
- [`payment-service/README.md`](payment-service/README.md) — covers FastAPI, async payment flows, background job processing, webhook signing, and observability pieces.
