import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Has Refresh Token: {bool(u.google_refresh_token)}")

asyncio.run(main())
