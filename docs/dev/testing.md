# Testing Patterns

Reference for writing and running tests in the Friday application.

## Backend Testing

### Framework & Setup

- **Framework**: pytest with `pytest-asyncio` for async test support
- **HTTP Client**: httpx with `ASGITransport` (no real server needed)
- **Config**: `backend/tests/conftest.py`

### Test Fixtures

```python
# Session-scoped event loop
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

# Request-scoped async HTTP client
@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        ac.headers["X-User-ID"] = TEST_USER_ID
        yield ac
```

**Key constants**:
- `TEST_USER_ID = "00000000-0000-0000-0000-000000000001"` (matches dev user from seed)
- `FAKE_UUID = "00000000-0000-0000-0000-000000000099"` (for negative tests)

### Writing Tests

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_issue(client: AsyncClient):
    response = await client.post(
        f"/api/v1/projects/{project_id}/issues",
        json={"summary": "Test issue", "issue_type_id": str(type_id)},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["summary"] == "Test issue"
```

### Conventions

- Test files go in `backend/tests/` with `test_` prefix
- Use `@pytest.mark.asyncio` for all async tests
- Test against the ASGI app directly (no network calls)
- Auth is provided via `X-User-ID` header set in the client fixture
- Group related tests in classes: `class TestIssueEndpoints:`

### Running Backend Tests

```bash
make test-backend          # Run all tests
# Or for specific tests:
docker compose exec backend pytest -v backend/tests/test_issues.py -k "test_create"
```

## Frontend Testing

### Framework

- **Framework**: vitest (Vite-native test runner)
- **Component testing**: React Testing Library

### Running Frontend Tests

```bash
make test-frontend         # Run all tests
```

### Conventions

- Test files use `.test.ts` or `.test.tsx` suffix
- Co-locate tests with components or in a `__tests__/` directory
- Use `vi.mock()` for mocking API calls
- Test user interactions, not implementation details

## Test Philosophy

- **No mocking of database/Redis in backend tests** — use real services via Docker
- **Async all the way** — all backend tests are async
- **Verbose output** — use `-v --tb=short` for readable test output
- **Test the API contract** — focus on HTTP status codes, response shapes, and error handling
- **Seed data** — tests rely on seeded roles and dev user from `make seed`
