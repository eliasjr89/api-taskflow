# TaskFlow API

This is the backend REST API for the TaskFlow application. It provides endpoints for user authentication, project management, task tracking, and administration.

## Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: PostgreSQL (Prisma ORM)
- **Caching**: Redis
- **Logging**: Winston (Structured JSON in Production)
- **Authentication**: JWT & Role-Based Access Control (RBAC)
- **Documentation**: Swagger UI

## Getting Started

### Prerequisites

- Node.js (v20+)
- PostgreSQL 15+
- Redis 7+

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (refer to `src/config/env.js` for validation schema).
4. Sync database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Development & Testing

- **Local Development**: `npm run dev` (uses nodemon)
- **Unit Testing**: `npm run test:unit`
- **E2E Testing**: `npm run test:e2e`
- **Full Quality Check**: `npm run test` (Lint + Unit + E2E)

## Infrastructure

### Logging (Winston)

The application uses a centralized logger in `src/utils/logger.js`.

- **Development**: Colored, human-readable format.
- **Production**: JSON structured for high observability (CloudWatch, ELK, etc.).

### CI/CD

A GitHub Actions workflow is active in `.github/workflows/test.yml`. It automatically validates:

- Code Linting (ESLint)
- Database schema integrity
- Unit tests
- End-to-End flows (Supertest + Real Services)

## Documentation

Full API documentation is available at: `/api-docs` when the server is running.
