# LeadPilot AI

[![CI](https://github.com/AloneRider-pixel/Leadpilot-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/AloneRider-pixel/Leadpilot-AI/actions/workflows/ci.yml)
[![CodeQL](https://github.com/AloneRider-pixel/Leadpilot-AI/actions/workflows/codeql.yml/badge.svg)](https://github.com/AloneRider-pixel/Leadpilot-AI/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI-assisted lead intelligence for property and sales workflows. LeadPilot turns lead profiles, conversations, and property context into structured analysis while keeping model credentials on the server.

## Product boundary

The browser is the presentation layer. The Express server is the trust boundary for AI-provider credentials, analysis orchestration, and server-side data access.

```text
React + Vite
     │
     ├── lead workspace
     ├── conversation context
     └── property context
           │
           ▼
      Express API
           │
           ▼
     AnalysisEngine
           │
           ▼
      Google Gemini
```

## Stack

| Layer | Technology |
|---|---|
| UI | React, Vite, TypeScript |
| AI | Google GenAI / Gemini |
| API | Express |
| Data | Firebase |
| Styling | Tailwind CSS |
| Runtime | Bun 1.4.2 |
| Validation | TypeScript |
| Delivery | GitHub Actions |

## Repository map

```text
src/                    # React application
server/                 # AI and business logic
shared/                 # Shared application types
public/                 # Static assets
server.ts               # Express entrypoint
vite.config.ts          # Vite configuration
bun.lock                # Reproducible dependency graph
firestore.rules         # Firebase authorization rules
.github/workflows/      # CI and security verification
```

## Quick start

Prerequisites: Bun 1.4.2 and configured Firebase/Gemini access.

```bash
git clone https://github.com/AloneRider-pixel/Leadpilot-AI.git
cd Leadpilot-AI
bun ci
bun run lint
bun run build
bun run dev
```

Health endpoint: `GET /api/health`.

Keep Gemini credentials server-side and never commit live Firebase or provider credentials.

## Verification

```bash
bun ci
bun run lint
bun run build
bun audit --audit-level=high
```

CI validates type safety and production build output and, where configured, performs CodeQL, dependency vulnerability, and Scorecard analysis.

## Security model

Treat lead records, transcripts, property context, user input, external provider data, and model output as untrusted application data. Validate request shapes at the server boundary and preserve Firebase security rules when changing data access.

## Evaluation integrity

Do not present deterministic fixtures or synthetic examples as AI-quality or production performance results. Any quantitative claim should identify its dataset, configuration, environment, measurement method, and producing commit.

## Documentation and contribution

Prefer small reviewable changes. Keep `package.json` and `bun.lock` synchronized, preserve server-side secret boundaries, and keep CI deterministic.

## License

MIT
