import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, test_user):
    response = await async_client.post("/api/v1/auth/login", json={
        "username": "cashier",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_wrong_password(async_client: AsyncClient, test_user):
    response = await async_client.post("/api/v1/auth/login", json={
        "username": "cashier",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

@pytest.mark.asyncio
async def test_get_me(async_client: AsyncClient, auth_headers, test_user):
    response = await async_client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "cashier"
    assert data["restaurant_id"] == test_user.restaurant_id
