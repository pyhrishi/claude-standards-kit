# /project:plan
Create a FraudFighter implementation plan before writing any code.

1. Load `docs/ARCHITECTURE.md` and `docs/CLAUDE_BACKEND.md`
2. Ask: what feature/service/endpoint are we building?
3. Produce in order:
   - **Service layer:** which FF service owns this? Does a new one need to be created?
   - **DB changes:** new tables (ff_ prefix + all mandatory columns), migrations needed
   - **API contracts:** endpoint names (PascalCase), request/response DTOs
   - **Affected services:** what other FF services need to be updated or called?
   - **SLA check:** does anything on the inline path risk the P99 ≤ 10ms budget?
   - **Task list:** ordered implementation steps (DB → Repository → Service → Controller → Tests)
4. Do NOT write code. Plan only. Delegate to ff-planner subagent if available.
