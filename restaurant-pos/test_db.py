import asyncio
import asyncpg

async def main():
    try:
        conn = await asyncpg.connect('postgresql://artursettarov:Coder0228@localhost:5432/hisobot_db')
        print("Baza bilan aloqa o'rnatildi!")
        await conn.close()
    except Exception as e:
        print(f"Xatolik: {e}")

asyncio.run(main())
