# Kabak AI Documentation

This folder contains project documentation and policies.

## Quick Links
- Root README: `../README.md`
- Contributing Guide: `CONTRIBUTING.md`
- Security Policy: `SECURITY.md`
- Model Notes: `MODELS.md`
- Testing Notes: `TESTING.md`

## Environment
Required:
- `VITE_GEMINI_API_KEY`

Optional:
- `VITE_USERNAME`
- `VITE_PASSWORD`

## Deployment (Netlify)
`netlify.toml` is configured for SPA deployment.
- Build command: `npm run build:client`
- Publish directory: `client/dist`