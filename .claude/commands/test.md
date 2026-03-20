# /project:test
Generate complete test suite for the current file. Delegate to ff-tdd-guide subagent.

1. Identify layer: controller / service / repository
2. **Service layer:** Unit tests
   - Mock all repositories and external clients (RulesEngineClient, MLScoringClient)
   - Cover: happy path, all validation failures, auth failure, not found, external service down
   - For scoring methods: assert latency < 10ms on the inline path
3. **Controller layer:** Integration tests
   - 200/201 happy path
   - 400 per required field (one test per field)
   - 401 missing/invalid token
   - 403 insufficient role
   - 404 resource not found
   - 500 upstream service error
4. **Repository layer:** Integration tests with Testcontainers (real PostgreSQL)
   - Include tenant_id isolation test: assert query with tenant_id=A cannot return tenant_id=B records
5. Naming: `methodName_scenario_expectedResult`
6. Target: 80%+ line coverage on service layer
