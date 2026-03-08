# Contributing

Thanks for contributing to Kabak AI.

## Development Setup
1. Install dependencies: `npm install`
2. Configure env: `cp .env.example .env`
3. Start client: `npm run dev`
4. Run checks: `npm run check`

## Branch and Commit Guidelines
- Create short, focused branches.
- Prefer one concern per pull request.
- Use clear commit messages in imperative mood.
  - Example: `fix: prevent duplicate job execution`

## Pull Request Rules
- Keep PRs reviewable and scoped.
- Include reproduction steps for bug fixes.
- Include screenshots for UI changes.
- Update docs when behavior changes.

## Code Quality
Before opening a PR:
- Run `npm run typecheck`
- Run `npm run build`
- Ensure no secret values are committed

## Security
Do not open public issues for vulnerabilities.
Use `SECURITY.md` for private reporting guidance.
