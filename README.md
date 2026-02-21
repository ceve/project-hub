# Project Hub

Full-stack project management app with JWT auth, RBAC, and CRUD for projects, tasks, and comments.

## Tech Stack

- **API**: Node.js + TypeScript + Express, PostgreSQL, JWT, Zod validation
- **Web**: React 19 + Vite + TypeScript, responsive CSS
- **Infra**: Docker Compose (api / web / postgres)

## Seed Users

| Email              | Password   | Role  |
|--------------------|------------|-------|
| admin@example.com  | admin123   | admin |
| user@example.com   | user123    | user  |

## Local Development

### With Docker Compose (recommended)

```bash
cp .env.example .env
docker compose up --build
```

App: http://localhost:3000
API: http://localhost:3001
Health: http://localhost:3000/healthz

### Without Docker

```bash
# Start Postgres (port 5432, db: project_hub, user/pass: postgres)

# API
cd api && npm install
npm run migrate && npm run seed
npm run dev

# Web (separate terminal)
cd web && npm install
npm run dev
```

API: http://localhost:3001
Web: http://localhost:5173 (Vite proxies /api to API)

## API Endpoints

| Method | Path                | Auth     | Description          |
|--------|---------------------|----------|----------------------|
| GET    | /healthz            | -        | Health check         |
| POST   | /api/auth/register  | -        | Register user        |
| POST   | /api/auth/login     | -        | Login                |
| GET    | /api/auth/me        | Bearer   | Current user profile |
| GET    | /api/auth/users     | Admin    | List all users       |
| GET    | /api/projects       | Bearer   | List projects        |
| POST   | /api/projects       | Bearer   | Create project       |
| GET    | /api/projects/:id   | Bearer   | Get project          |
| PUT    | /api/projects/:id   | Bearer   | Update project       |
| DELETE | /api/projects/:id   | Owner/Admin | Delete project    |
| GET    | /api/tasks?project_id= | Bearer | List tasks         |
| POST   | /api/tasks          | Bearer   | Create task          |
| PUT    | /api/tasks/:id      | Bearer   | Update task          |
| DELETE | /api/tasks/:id      | Bearer   | Delete task          |
| GET    | /api/comments?task_id= | Bearer | List comments      |
| POST   | /api/comments       | Bearer   | Create comment       |
| PUT    | /api/comments/:id   | Author/Admin | Update comment  |
| DELETE | /api/comments/:id   | Author/Admin | Delete comment  |

## Tests

```bash
cd api && npm test
```

Requires a running PostgreSQL instance.

## Deploy (Coolify)

Uses docker-compose build pack on Coolify with domain `https://project-hub.rubic.se`.

```bash
# Set JWT_SECRET env var in Coolify after creation
coolify --context lan --token "$COOLIFY_TOKEN" app env create <app-uuid> \
  --key JWT_SECRET --value "<secret>" --is-build-time false
```
