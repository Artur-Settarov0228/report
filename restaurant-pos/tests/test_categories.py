import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_category(async_client: AsyncClient, auth_headers):
    response = await async_client.post("/api/v1/categories", headers=auth_headers, json={
        "name": "Ichimliklar",
        "description": "Sovuq ichimliklar"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Ichimliklar"
    assert data["is_active"] is True

@pytest.mark.asyncio
async def test_get_categories(async_client: AsyncClient, auth_headers):
    # First create
    await async_client.post("/api/v1/categories", headers=auth_headers, json={"name": "Taomlar"})
    
    # Then get
    response = await async_client.get("/api/v1/categories", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

@pytest.mark.asyncio
async def test_delete_category(async_client: AsyncClient, auth_headers):
    # Create
    create_response = await async_client.post("/api/v1/categories", headers=auth_headers, json={"name": "Salatlar"})
    category_id = create_response.json()["id"]
    
    # Delete (soft delete)
    delete_response = await async_client.delete(f"/api/v1/categories/{category_id}", headers=auth_headers)
    assert delete_response.status_code == 200
    assert delete_response.json()["is_active"] is False
