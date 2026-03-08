# Kabak AI

AI-assisted fashion content workflow for e-commerce teams.

Kabak AI converts raw product photos into:
- SEO-ready product title and description
- AI model visuals (front and back)
- AI-generated short fashion video preview

It is built as a local-first React application with IndexedDB persistence and optional server entry points.

## Highlights
- Local-first product storage with IndexedDB
- Image + video asset persistence per product
- Product lifecycle states (analysis, front, back, video)
- Landing page model usage and pricing simulation
- Collection analytics dashboard (requests, RPD, estimated cost)
- TR/EN localization via `client/src/locales/lang.json`
- Tailwind CSS UI with responsive layouts

## Tech Stack
- React 18
- Vite 7
- Tailwind CSS 3
- TypeScript
- Express (server entry)
- Google GenAI SDKs (`@google/generative-ai`, `@google/genai`)

## Repository Structure
- `client/`: frontend app (Vite + React + Tailwind)
- `server/`: server-side entry/controllers
- `shared/`: shared constants/types
- `docs/`: project documentation and policies
- `.github/`: templates and GitHub metadata

## Getting Started
1. Install dependencies.
```bash
npm install
```
2. Create environment file.
```bash
copy .env.example .env
```
3. Start development server.
```bash
npm run dev
```
4. Open `http://localhost:3000`.

## Scripts
- `npm run dev`: run client dev server
- `npm run build:client`: build client
- `npm run preview:client`: preview client build
- `npm run dev:server`: run server entry
- `npm run typecheck`: TypeScript checks (client + server)
- `npm run check`: `typecheck` + `build:client`

## Environment Variables
Required:
- `VITE_GEMINI_API_KEY`: API key for Gemini and video fetch operations

Optional:
- `VITE_USERNAME`: login username
- `VITE_PASSWORD`: login password
- `VITE_DEBUG_AI_LOGS`: set `true` to enable verbose AI debug logs
- `PORT`: server port (default `4000`)

## Model Setup
Current model mapping in `client/src/config/models.json`:
- Text: `gemini-2.5-flash` (primary), `gemini-2.0-flash` (fallback)
- Image: `models/gemini-3-pro-image-preview` (primary)
- Video: `veo-3.1-generate-preview` (primary), `veo-3.0-generate-001` (fallback)

## Data and Persistence
- Product metadata is stored in IndexedDB.
- Video blobs are stored in IndexedDB and reused after refresh.
- A source video link fallback is also stored per product.
- Collection and product pages subscribe to storage updates for live refresh.

## Security Notes
- Do not commit `.env` or API keys.
- Restrict API keys by domain and API scope.
- Rotate compromised keys immediately.
- Validate uploads and sanitize user inputs.
- See [Security Policy](docs/SECURITY.md).

## Deployment
Netlify is supported via `netlify.toml`:
- build command: `npm run build:client`
- publish directory: `client/dist`

## Contributing
See [Contributing Guide](docs/CONTRIBUTING.md).

## Troubleshooting
- `403 SERVICE_DISABLED` during video download:
  - enable Generative Language API in the target Google Cloud project
  - wait propagation (usually a few minutes) and retry
- No video after refresh:
  - verify product video blob/link exists in IndexedDB
- Build/type issues:
  - run `npm run typecheck` then `npm run build:client`

## License
MIT License. See [LICENSE](LICENSE).
