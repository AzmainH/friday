import asyncio

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client():
    """Async HTTP client wired to the FastAPI app via ASGI transport."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        ac.headers["X-User-ID"] = TEST_USER_ID
        yield ac


# Stub auth user
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
FAKE_UUID = "00000000-0000-0000-0000-000000000099"
