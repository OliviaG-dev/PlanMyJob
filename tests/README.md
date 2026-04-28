# Test architecture

- Unit tests stay close to source files in `src/**`.
- Integration tests live in `tests/integration/**`.
- End-to-end scenarios live in `tests/e2e/**`.
- Reusable test data lives in `tests/fixtures/**`.
- Shared test utilities live in `tests/helpers/**`.

Naming conventions:

- `*.test.ts` for unit tests.
- `*.integration.test.ts` for integration tests.
- `*.e2e.test.ts` for e2e tests.
