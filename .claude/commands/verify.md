# /project:verify
Run the full FraudFighter verification loop on the current service.

In order:
1. **Build** — compile/lint with zero errors or warnings
2. **Unit tests** — run, assert all pass, report coverage (target 80%+)
3. **Standards review** — run `/project:review` on changed files
4. **Security scan** — run `/project:security` on changed files
5. **SLA check** — for scoring paths: verify no blocking I/O introduced
6. **tenant_id check** — grep for any new query missing tenant_id filter

Report: PASS / FAIL per step. Stop on first CRITICAL failure.
Do not proceed to the next step if previous failed.
