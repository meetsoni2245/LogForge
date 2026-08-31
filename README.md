# LogForge

LogForge is a TypeScript-based REST API designed for ingesting, parsing, storing, and querying application and server logs. The application provides structured log storage with PostgreSQL persistence managed via Prisma ORM, input validation using Zod, and user authentication using JSON Web Tokens. 

The architecture separates routing, request handling, business logic, and database operations into distinct layers. LogForge includes diagnostics and security measures such as request ID propagation, structured request logging in JSON format, rate limiting, and centralized error management.

---

## Features

### Authentication & Security
- Secure access to log-management endpoints using JSON Web Tokens (JWT) passed through the standard `Authorization: Bearer <token>` header.
- Password hashing with `bcrypt` for user registration and authentication.
- Endpoints protected against excessive traffic spikes via rate limiting managed by `express-rate-limit`.

### Log Ingestion & Parsing
- Individual log ingestion using structured JSON payloads.
- Bulk ingestion supporting concurrent arrays of structured logs.
- Plain-text raw log-line ingestion processed by an internal parser that decomposes standard space-delimited string messages into validated log models.

### Querying & Analytics
- Database query pagination with limit and page offsets, accompanied by structured metadata.
- Severity level filtering restricted to the supported levels: `INFO`, `WARN`, and `ERROR`.
- Message search performing pattern matches against the log message text.
- ISO-compliant date-range queries utilizing start (`from`) and end (`to`) bounds.
- Ingestion metrics grouping total counts and counts sorted by log level over optional date ranges.

### Observability & Resilience
- Unique request tracking using the `X-Request-Id` header to correlate inbound requests, internal actions, and errors.
- Structured JSON request logging capturing operational metadata for every inbound transaction.
- Unified error-handling middleware that formats operational and unhandled exceptions into structured JSON responses.

### Developer Experience
- Interactive and visual documentation of all exposed paths using Swagger UI, served directly by the application.
- Testing setup configured to support unit and integration testing via Vitest and Supertest.

---

## Architecture

LogForge uses a modular architecture with distinct, decoupled responsibilities:

### Controllers
Located within modules (`src/modules/auth/` and `src/modules/logs/`), controllers process HTTP requests. They parse and validate request parameters using Zod schemas, execute controller-level helper functions (such as parsing raw log lines), orchestrate service calls, and serialize HTTP responses.

### Services
Services contain the application's business logic. They decouple controller operations from data-access patterns, enforcing boundaries, calculating derived stats, and managing batch transactions.

### Repositories
Repositories isolate the data access layer. They wrap the Prisma database client and query engines, ensuring database-specific queries (such as range filtering or level counts) are abstracted away from service modules.

### Validation
Strict validation schemas are written using Zod. Rather than running validation automatically at the routing layer, controllers explicitly parse request payloads against these schemas to handle errors uniformly within the request pipeline.

### Parsers
The custom raw log parser (`src/parsers/log.parser.ts`) extracts log properties from a string. It processes raw strings by splitting them along space character boundaries (`line.split(" ")`) to separate metadata from the trailing log message.

### Middleware
Middleware functions intercept the request-response lifecycle to apply cross-cutting logic:
- **`request.id.middleware.ts`**: Generates a standard UUID tracking token if the incoming request lacks an `X-Request-Id` header, and ensures it is present in all outbound headers and logs.
- **`request.logging.middleware.ts`**: Outputs formatted JSON statements to standard output for request tracking.
- **`rate.limit.middleware.ts`**: Implements client-IP throttling policies on API endpoints.
- **`auth.middleware.ts`**: Validates the JWT signature on protected routes.
- **`error.middleware.ts`**: Intercepts operational and unhandled failures, converting them to standard response objects.

### Configuration
Environment configurations are managed within `src/config/env.ts` and `src/config/database.ts`. The configurations validate and load environment variables at runtime, ensuring missing critical parameters halt the server startup.

### Error Handling
LogForge separates operational exceptions from unhandled environment errors. Expected application failures throw custom operational exceptions using an `AppError` class. Unhandled database connectivity issues or unexpected errors raise generic instances of `Error`, which the centralized middleware formats before serving the final response.

---

## Project Structure

```text
src/
├── app.ts                          # Express application initialization and middleware piping
├── server.ts                       # Server startup script, database validation, and port binding
├── config/                         # Core configurations
│   ├── database.ts                 # Database connectivity status setup
│   └── env.ts                      # Environmental variable parsing and validation
├── docs/                           # OpenAPI documentation
│   └── openapi.ts                  # Swagger and OpenAPI specification mappings
├── errors/                         # Structured exception patterns
│   └── app.error.ts                # AppError operational exception class
├── generated/                      # Auto-generated database structures
│   └── prisma/
├── middleware/                     # Global interceptors
│   ├── error.middleware.ts         # Centralized error mapping and formatting
│   ├── rate.limit.middleware.ts    # Endpoint rate limiting
│   ├── request.id.middleware.ts    # Correlation ID injector and response headers
│   └── request.logging.middleware.ts # Structured JSON logger
├── modules/                        # Decoupled domains
│   ├── auth/                       # User creation, authentication, repository, and validation
│   │   ├── auth.controller.ts
│   │   ├── auth.middleware.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   ├── auth.token.ts
│   │   └── auth.validation.ts
│   └── logs/                       # Log storage, retrieval, aggregation, and tracking
│       ├── log.controller.ts
│       ├── log.repository.ts
│       ├── log.routes.ts
│       ├── log.service.ts
│       └── log.validation.ts
├── parsers/                        # Space-delimited log line converter
│   └── log.parser.ts
└── types/                          # Express ambient overrides
    └── express.d.ts
```

---

## Tech Stack

- **Node.js**: The underlying JavaScript runtime engine.
- **TypeScript**: Typed programming language compiling down to clean JavaScript.
- **Express**: Router framework for setting up requests and the middleware pipeline.
- **PostgreSQL**: Relational database for storing log metadata.
- **Prisma**: Type-safe database client and auto-generated ORM.
- **Zod**: Declarative runtime verification and type generation schemas.
- **JSON Web Tokens (JWT)**: Secure identity propagation format.
- **bcrypt**: Cryptographic password hashing.
- **express-rate-limit**: Standard client rate limiting.
- **Vitest**: Test execution engine.
- **Supertest**: HTTP routing test agent.
- **Swagger UI & OpenAPI 3**: Standardization specifications to expose interactive documentation.

---

## Getting Started

### Prerequisites
- Node.js installed on your local host
- A running PostgreSQL database instance

### Installation
Clone the source code repository directly from GitHub:

```bash
git clone https://github.com/meetsoni2245/LogForge.git
cd LogForge
npm install
```

### Environment Configuration
The application reads configuration values from a `.env` file in the root folder. Refer to `.env.example` in the root of the project to check which parameters are configured. A standard environment setup typically includes:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/logforge?schema=public"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="1d"
```

### Database Setup
To build database tables and generate client types, execute the following commands:

```bash
# Generate type-safe Prisma client classes
npm run db:generate

# Execute database schema migrations against your active PostgreSQL instance
npm run db:migrate

# Launch the interactive database visualizer in your browser
npm run db:studio
```

### Development
Launch LogForge in development mode with active source-file tracking enabled:

```bash
npm run dev
```

### Production Build
Compile your TypeScript source files into executable production JavaScript:

```bash
npm run build
```

### Production Start
Start the compiled JavaScript application from the `dist` directory:

```bash
npm start
```

---

## API Reference

### Health Check

#### GET /health
- **Authentication**: Public
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy"
    }
  }
  ```

---

### Authentication

#### POST /api/auth/register
- **Authentication**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "cb1c1a93-ea1d-4f10-bf9b-8eefbead9399",
      "email": "user@example.com",
      "createdAt": "2026-08-31T12:00:00.000Z"
    }
  }
  ```

#### POST /api/auth/login
- **Authentication**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

### Log Ingestion

The properties supported on Log schemas in the database are strictly: `id`, `timestamp`, `level`, `message`, and `createdAt`.

#### POST /api/logs
- **Authentication**: Bearer Token Required
- **Request Body**:
  ```json
  {
    "timestamp": "2026-08-31T12:00:00.000Z",
    "level": "INFO",
    "message": "User session initialized"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "e98dfa93-ef72-468e-908d-8bb8ef87dbb2",
      "timestamp": "2026-08-31T12:00:00.000Z",
      "level": "INFO",
      "message": "User session initialized",
      "createdAt": "2026-08-31T12:00:01.450Z"
    }
  }
  ```

#### POST /api/logs/bulk
- **Authentication**: Bearer Token Required
- **Request Body**:
  ```json
  {
    "logs": [
      {
        "timestamp": "2026-08-31T12:05:00.000Z",
        "level": "WARN",
        "message": "API latency limit exceeded (250ms)"
      },
      {
        "timestamp": "2026-08-31T12:05:05.000Z",
        "level": "ERROR",
        "message": "Database query connection timeout"
      }
    ]
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "count": 2
    }
  }
  ```

#### POST /api/logs/raw
- **Authentication**: Bearer Token Required
- **Request Body**:
  ```json
  {
    "line": "2099-07-15T12:00:00.000Z ERROR Database connection failed"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "bfd8e792-7fca-44f2-901b-99abdc87e6fa",
      "timestamp": "2099-07-15T12:00:00.000Z",
      "level": "ERROR",
      "message": "Database connection failed",
      "createdAt": "2026-08-31T12:10:00.000Z"
    }
  }
  ```

---

### Log Querying

#### GET /api/logs
- **Authentication**: Bearer Token Required
- **Query Parameters**:
  - `page` *(number)*: Selected results page index.
  - `limit` *(number)*: Maximum items per single page.
  - `level` *(string)*: Severity filter. Restricted to `INFO`, `WARN`, or `ERROR`.
  - `search` *(string)*: Text search matching text in log messages.
  - `from` *(string)*: ISO date-time query start boundary.
  - `to` *(string)*: ISO date-time query end boundary.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "e98dfa93-ef72-468e-908d-8bb8ef87dbb2",
        "timestamp": "2026-08-31T12:00:00.000Z",
        "level": "INFO",
        "message": "User session initialized",
        "createdAt": "2026-08-31T12:00:01.450Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "totalRecords": 1,
      "totalPages": 1
    }
  }
  ```

---

### Statistics

#### GET /api/logs/stats
- **Authentication**: Bearer Token Required
- **Query Parameters**:
  - `from` *(string)*: Date-time start boundary.
  - `to` *(string)*: Date-time end boundary.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalLogs": 3,
      "byLevel": {
        "INFO": 1,
        "WARN": 1,
        "ERROR": 1
      }
    }
  }
  ```

---

### Retrieve Log by ID

#### GET /api/logs/:id
- **Authentication**: Bearer Token Required
- **Path Parameters**:
  - `id` *(UUID)*: Unique log record identifier.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "e98dfa93-ef72-468e-908d-8bb8ef87dbb2",
      "timestamp": "2026-08-31T12:00:00.000Z",
      "level": "INFO",
      "message": "User session initialized",
      "createdAt": "2026-08-31T12:00:01.450Z"
    }
  }
  ```

---

### Delete Log

#### DELETE /api/logs/:id
- **Authentication**: Bearer Token Required
- **Path Parameters**:
  - `id` *(UUID)*: Unique log record identifier.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Log deleted successfully"
    }
  }
  ```

---

## Authentication

Paths managing user identities (`/api/auth`) are public, whereas endpoints under `/api/logs` are secure and require token-based authentication.

The token validation middleware intercepts inbound secured requests. Clients must declare their credential credentials inside an `Authorization` header containing a valid bearer token:

```http
Authorization: Bearer <JWT_TOKEN_STRING>
```

If the authorization header is omitted, structured incorrectly, or has expired, the request is blocked and returns an HTTP 401 Unauthorized response.

---

## Raw Log Ingestion

Structured log objects can be ingested through text logs using the raw ingestion route:

```http
POST /api/logs/raw
```

The payload accepts a plain text line under the `line` parameter:

```json
{
  "line": "2099-07-15T12:00:00.000Z ERROR Database connection failed"
}
```

The parse logic within the raw parser (`src/parsers/log.parser.ts`) extracts log properties by calling `line.split(" ")` to process space-delimited text blocks into three specific segments:
1. **`timestamp`**: Expected as an ISO-8601 string.
2. **`level`**: Restricted to `INFO`, `WARN`, or `ERROR`.
3. **`message`**: Any remaining text on the split path.

Parsing failures due to bad formats, empty text structures, or incorrect logging levels cause the request to fail, returning an HTTP 400 Bad Request error. The response returns one of the custom operational error messages:
- `Invalid log line format`
- `Invalid timestamp format`
- `Unsupported log level: <LEVEL_VALUE>`
- `Log message cannot be empty`

An example of a failed response payload:

```json
{
  "success": false,
  "error": {
    "message": "Unsupported log level: DEBUG",
    "requestId": "fd29ca83-fbda-4cf1-83da-0012bcfa73da"
  }
}
```

---

## Request IDs and Structured Logging

LogForge uses tracking middleware (`request.id.middleware.ts`) to manage transaction records. The middleware handles correlation using an standard header:

- **Correlation Header**: `X-Request-Id`

If the client supplies an `X-Request-Id` header with their HTTP request, the application propagates it. If the header is missing, the middleware generates a new UUID. This correlation identifier is included in both responses and logging fields.

All inbound transactions are recorded by the structured logger (`request.logging.middleware.ts`), generating JSON messages containing:
- `timestamp`: Record creation time.
- `method`: HTTP request verb.
- `path`: Active request endpoint path.
- `statusCode`: HTTP response status code.
- `durationMs`: Total duration in milliseconds.
- `requestId`: Associated transaction id.

Example JSON output structure:

```json
{"timestamp":"2026-08-31T12:45:00.124Z","method":"POST","path":"/api/logs","statusCode":201,"durationMs":14,"requestId":"2cfa7ea3-fd1b-4cd2-bda3-87fbcde912aa"}
```

---

## Error Handling

Application errors are caught by the global error handler (`error.middleware.ts`). 

Operational failures (such as schema mismatches or authentication issues) are thrown using instances of the custom `AppError` class (`src/errors/app.error.ts`), which supports:
- `statusCode` (e.g. `400`, `401`, `404`, `429`)
- `message` (Informative error descriptions)
- An optional `details` field of type `unknown` containing validation details or context
- An optional `code` field of type `string` representing internal application error codes

Unexpected issues—such as database connection drops—throw standard JavaScript `Error` instances. These are caught by the error middleware, which logs them securely and returns a generic HTTP 500 error payload to protect internal system details.

Regardless of the failure source, error responses are returned as standard JSON:

```json
{
  "success": false,
  "error": {
    "message": "Resource requested not found",
    "requestId": "2cfa7ea3-fd1b-4cd2-bda3-87fbcde912aa"
  }
}
```

This handling covers:
- **Zod Validation Exceptions**: Caught at the controller level during parsing and mapped to HTTP 400.
- **Log Parsing Errors**: Converted into HTTP 400 responses with descriptive messages.
- **Unauthorized Paths**: Handled using HTTP 401.
- **IP Rate Throttling**: Triggers HTTP 429 errors.
- **Unmapped Resource Path**: Returns HTTP 404.

---

## API Documentation

LogForge serves interactive API specifications using Swagger UI, exposing routes and validation details.

The documentation interface is accessible locally at:
- **Interactive documentation**: `http://localhost:3000/docs`
- **Specification document**: `http://localhost:3000/docs/openapi.json`

---

## Testing

LogForge uses **Vitest** for running test assertions alongside **Supertest** to test route and middleware lifecycles.

### Coverage
- **Unit Tests**: Verifies raw space-delimited string parsing, environment validation, tracking middlewares, and error mapping.
- **Integration Tests**: Tests authentication routines, user registrations, structured and bulk log creation, query filtering, pagination, and deletion paths.

### Verification Commands
To execute the test suites, run:

```bash
npm test
```

To run TypeScript compiler type checking:

```bash
npm run lint
```

---

## License

LogForge is open-source software. There is currently no license file in the repository. The project remains subject to default copyright permissions and terms defined by the repository owner.