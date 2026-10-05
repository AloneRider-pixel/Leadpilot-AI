# LeadPilot AI

AI-assisted lead intelligence for property and sales workflows. LeadPilot turns lead profiles, conversations, and property context into structured analysis while keeping model credentials on the server.

## Architecture

```text
React + Vite
     |
     +-- lead workspace
     +-- conversation context
     +-- property context
             |
             v
        Express API
             |
             v
       AnalysisEngine
             |
             v
       Google Gemini
```

The browser is the presentation layer. The Express server is the provider trust boundary and owns Gemini credentials and AI analysis.

## Stack

| Layer | Technology |
| --- | --- |
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
.github/workflows/      # CI verification
```

## Quick start

Prerequisites: Bun 1.4.2 and configured Firebase/Gemini access.

```bash
bun ci
bun run lint
bun run build
bun run dev
```

Health endpoint: GET /api/health.

## Configuration and security

Keep credentials outside source control. In particular, GEMINI_API_KEY is server-side only.

Treat lead records, transcripts, property context, and model output as untrusted application data. Validate request shapes at the server boundary and preserve Firebase security rules when changing data access.

## Verification

CI runs a frozen dependency install followed by TypeScript validation and the production Vite build:

```text
bun ci
  -> bun run lint
  -> bun run build
```

The repository does not claim AI-quality or performance results without a reproducible dataset, configuration, environment, and measurement method.

## Development standard

Prefer small reviewable changes. Keep package.json and bun.lock synchronized. Keep provider credentials server-side. Make CI deterministic and preserve explicit security boundaries.

## License

MIT
