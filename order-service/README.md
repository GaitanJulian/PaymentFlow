# Order Service (Node.js + TypeScript)

This service is the authoritative source for orders. It offers a REST API that tracks each order through the state machine `PENDING → PAID → FAILED → CANCELED → SHIPPED`, hands off payments to the Payment Service, and publishes events for downstream consumers.

## Stack

- **Runtime & Framework**: Node.js with Express / Fastify / NestJS (typical NestJS modules for clean architecture).
- **ORM & DB**: Prisma managing a PostgreSQL database that stores orders, payments, and audit trails.
- **Security**: JWT access/refresh tokens, role-based guards (`USER`, `ADMIN`), and correlation IDs injected into headers for tracing.
- **Events**: HTTP-based `order.created` events (upgradeable to RabbitMQ/Kafka) plus endpoints to receive payment success/failure notifications.

## Key Responsibilities

1. Create orders and transition them according to payment feedback.
2. Validate input via DTOs/pipes, enforce policies per role, and guard unsafe transitions.
3. Publish `order.created` events (initially HTTP POST to the Payment Service and logging events for observability).
4. Expose webhook endpoint `/webhooks/payment` to accept signed callbacks that map to order updates.

## Testing & Automation

- Unit and integration tests powered by Jest + Supertest, targeting DTOs, guards, controllers, and Prisma repositories.
- Optional integration suite using Testcontainers to spin up PostgreSQL during CI runs.
- ESLint + Prettier enforce style and catch issues early.

## Next steps

1. Scaffold Prisma schema and migrations.
2. Wire up JWT auth plus refresh tokens.
3. Add event publisher helper (HTTP and message broker).
4. Document API via OpenAPI/Swagger and provide Postman/HTTP collection for recruiters.

## Dev notes

- Copy `.env.example` to `.env` and adjust the PostgreSQL connection string.
- Run `npm run prisma:generate` after editing `prisma/schema.prisma`.
- Start the dev server with `npm run dev` and rely on Prisma Client for database access.
