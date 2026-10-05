# Restaurant POS Backend

Restaurant uchun kassirga mo'ljallangan POS (Point of Sale) tizimining backend qismi. Loyiha faqat kassir (`CASHIER`) roli uchun optimallashtirilgan bo'lib, quyidagi modullarni o'z ichiga oladi:

- Kassir profilini boshqarish (Auth / JWT)
- Kategoriyalarni boshqarish
- Mahsulotlar (narx, rasm, o'lchov birligi, qidiruv)
- Stollar va ularning dinamik holati (Bo'sh / Band)
- Buyurtmalar (Order & OrderItems) va narxlarni snapshot qilish (tarixiy narxlarni saqlash)
- To'lovlarni qabul qilish (Naqd, Karta, Click, Payme)
- Hisobotlar (Kunlik, Haftalik, Oylik, Dashboard)

## Texnologiyalar

- **Python 3.12+**
- **FastAPI** (REST API, Swagger)
- **SQLAlchemy 2.0** (Async, Modular Monolith)
- **PostgreSQL** + **asyncpg** (Ma'lumotlar bazasi)
- **Alembic** (Migration)
- **Docker** & **Docker Compose**
- **uv** (Dependency manager)
- **pytest** (Testlar)

## O'rnatish va Ishga tushirish

### 1. Muhit (Environment) o'zgaruvchilari
Loyiha papkasida `.env` faylini yarating va unga quyidagi ma'lumotlarni yozing:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/restaurant_pos
JWT_SECRET_KEY=super_secret_key_change_me_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

> **Eslatma:** Agar siz Dockerdan foydalanayotgan bo'lsangiz `localhost` ni `postgres` ga almashtiring. Docker Compose fayli `docker-compose.yml` da allaqachon sozlangan.

### 2. Dockerni ishga tushirish

Terminalda quyidagi komandani yozib PostgreSQL va FastAPI serverni ishga tushiring:

```bash
docker compose up -d
```

### 3. Migratsiyani yaratish va bazani yangilash (Alembic)

Ma'lumotlar bazasi ishga tushgach, boshlang'ich jadvallarni yaratish uchun migratsiya amallarini bajaring (uv o'rnatilgan bo'lishi kerak):

```bash
# Agar ulanish xato bersa .env faylingizdagi DATABASE_URL to'g'riligini tekshiring
uv run alembic revision --autogenerate -m "initial schema"
uv run alembic upgrade head
```

## API Hujjatlari (Documentation)

Server ishga tushganidan so'ng quyidagi manzillar orqali API larni sinab ko'rishingiz mumkin:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## Testlarni yurgizish

Loyihada Pytest yordamida testlar yozilgan. Ularni yurgizish uchun:
```bash
uv run pytest
```

---

*Loyiha "Modular Monolith" arxitekturasida tuzilgan bo'lib, kelajakda boshqa rollar (Admin, Oshpaz, Ofitsiant) qo'shilishiga va ko'p filialli (Multi-tenant) rejimga kengaytirishga to'liq tayyor qilingan.*
