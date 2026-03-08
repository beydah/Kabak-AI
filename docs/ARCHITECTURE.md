# Architecture

## Runtime Overview
Kabak AI is a local-first web application with a lightweight API layer.

- UI + orchestration run in the browser.
- Storage is persisted in IndexedDB.
- AI operations are coordinated through service classes.
- Server currently provides health and extension points.

## Core Client Layers
- `pages`: route entry points
- `components`: visual composition
- `services`: external integrations (AI/storage)
- `utils`: pure helper functions
- `context/providers`: app-wide orchestration

## Job Pipeline
The job manager provider polls active products and advances state in order:
1. Analysis
2. SEO
3. Front image
4. Back image
5. Finalization

Each stage persists status transitions to storage.

## Data Ownership
- Product state: IndexedDB (`products`)
- Draft state: IndexedDB (`drafts`)
- Logs: IndexedDB (`error_logs`)
- Metrics: IndexedDB (`metrics`)
- Preferences: cookies + localStorage fallback
