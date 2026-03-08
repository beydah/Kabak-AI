# Shared Module

Shared code used by both client and server.

## Contents
- `types/`: shared TypeScript types
- `constants/`: shared constants and enums

## Rules
- Keep this module framework-agnostic.
- Avoid browser-only or Node-only APIs here.
- Prefer pure functions and serializable data structures.
