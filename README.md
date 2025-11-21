# PaymentFlow

Polyglot microservice portfolio that showcases a Node.js/TypeScript Order Service coordinating with a FastAPI-based Payment Provider through signed webhooks, background jobs, and PostgreSQL-backed persistence. The stack demonstrates asynchronous workflows, multi-language ecosystems, and observability patterns that recruiters look for in senior backend profiles.

## Architecture

- **Order Service (Node.js + TypeScript + Prisma + PostgreSQL)**  
  * Manages the order lifecycle (`PENDING → PAID → FAILED → CANCELED → SHIPPED`).  
  * Exposes a REST API (Express) with JWT authentication, access/refresh tokens, and role-based access (USER / ADMIN).  
  * Supports `register`, `login`, `refresh`, `auth/me` plus CRUD on `/orders`, signed webhook handling, and publishes `order.created` events to the payment provider.

- **Payment Service (Python + FastAPI + SQLModel/SQLAlchemy + PostgreSQL)**  
  * Simulates a payment provider that processes idempotent `/payments` requests, stores traces, and issues signed webhooks back to the Order Service.  
  * Background workflow randomly decides `SUCCESS`/`FAILED`, retries webhooks with exponential backoff, and records webhook payloads + delivery flags.  
  * Supervises `/health` + `/payments/by-order` diagnostics and uses HMAC signing for authenticity.

- **Infrastructure Extras**  
  * Docker Compose brings up both services plus dedicated Postgres instances; shared env vars keep secrets (JWT, webhook HMAC) consistent.  
  * Unit tests (`jest`) cover auth token generation/rotation; the stack is testable via `npm run test` in the order service.
  * README documentation, env examples, and signed webhook helpers keep the portfolio narrative cohesive for recruiters.

## Getting started

1. Read the service-specific guides below to understand their responsibilities and tech choices.
2. Spin up the stack with `docker-compose -f dev/docker-compose.yml up --build` (or `make up` / `npm run dev:stack` when scripts are added).
3. Run linters/tests inside each service (`npm test` / `pytest`) and inspect endpoints via Swagger/OpenAPI docs.

Each service resides in its own folder to keep code, migrations, and tests self-contained while still delivering a connected system.

## Service Guides

- [`order-service/README.md`](order-service/README.md) – outlines the Node.js journey: API, events, JWT security, Prisma models, and testing strategy.
- [`payment-service/README.md`](payment-service/README.md) — covers FastAPI, async payment flows, background job processing, webhook signing, and observability pieces.
