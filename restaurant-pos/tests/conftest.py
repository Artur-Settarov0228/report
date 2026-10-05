import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.modules.users.models import User
from app.modules.restaurants.models import Restaurant

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def db_session():
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def test_restaurant(db_session: AsyncSession):
    restaurant = Restaurant(name="Test Restaurant", address="Test Address", phone="998901234567")
    db_session.add(restaurant)
    await db_session.commit()
    await db_session.refresh(restaurant)
    return restaurant

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession, test_restaurant: Restaurant):
    user = User(
        restaurant_id=test_restaurant.id,
        username="cashier",
        password_hash=get_password_hash("password123"),
        full_name="Test Cashier"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest_asyncio.fixture
async def auth_headers(async_client: AsyncClient):
    response = await async_client.post("/api/v1/auth/login", json={
        "username": "cashier",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
