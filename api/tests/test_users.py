import pytest
from httpx import ASGITransport, AsyncClient

from main import app

username = "kikiTest"

@pytest.mark.anyio
@pytest.mark.order("last")
async def test_read_user():
    async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://localhost:8000/users"
    ) as ac:
        response = await ac.get(f"/{username}")
    assert response.status_code == 200

@pytest.mark.anyio
@pytest.mark.order("last")
async def test_delete_user():
    async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://localhost:8000/users"
    ) as ac:
        response = await ac.post(
            f"/delete/{username}"
        )
        assert response.status_code == 200
