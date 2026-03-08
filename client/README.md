# Client Module

Frontend module built with React + Vite + Tailwind CSS.

## Main Folders
- `src/components`: UI components (atoms, molecules, organisms, templates)
- `src/pages`: route-level screens
- `src/services`: AI and storage services
- `src/utils`: utility functions
- `src/routes`: router definition
- `src/context`: React context providers

## Standards
- Keep page components thin.
- Move shared logic to `utils` or `services`.
- Keep storage access centralized under `storage_utils` and `storage_service`.
- Use typed interfaces from `src/types` and `shared/types`.
