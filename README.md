# TaskFlow API

This is the backend REST API for the TaskFlow application. It provides endpoints for user authentication, project management, task tracking, and administration.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger UI

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables in `.env` (see `.env.example`).
4.  Initialize the database:
    ```bash
    npm run db:reset
    npm run db:seed
    ```

### Running the Server

- **Development**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```

### Documentation

Once running, full API documentation is available at:
http://localhost:3000/api-docs
