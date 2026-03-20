# /project:scaffold
Scaffold a new FraudFighter backend service from scratch.

Ask the user:
1. Service name (e.g. ff-alert-service)
2. Language + framework (Java 17 + Spring Boot 3 / Node.js 20 + Express / Python 3.11 + FastAPI)
3. DB tables this service owns
4. Other FF services it calls

Then generate (all standards-compliant from line one):
- Folder structure per `docs/ARCHITECTURE.md`
- Controller, Service, Repository wired via DI (empty but structured)
- Global exception handler (FF error response format)
- Structured JSON logger (Jaeger traceId injection)
- JWT middleware stub
- Response builder utility
- Health endpoint: `GET /health → { status:"ok", service, timestamp }`
- `.env.example` (no real values — all required vars listed)
- Multi-stage Dockerfile (non-root user, health check)
- Base unit test structure with example mock setup
- Service-specific `CLAUDE.md` (short, references shared docs/)

Fill in `.ai/context/tech-stack.md` with the answers before generating.
