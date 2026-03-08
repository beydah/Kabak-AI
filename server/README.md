# Server Module

Backend module for API endpoints and runtime checks.

## Current Scope
- Express server entry (`server_entry.ts`)
- Health endpoint (`/api/health`)
- Auth controller skeleton

## Recommended Growth Path
- `routes/` for endpoint registration
- `controllers/` for request handlers
- `services/` for business logic
- `middlewares/` for auth/error handling
- `validators/` for schema validation

Keep controllers small and testable; move logic into services.
