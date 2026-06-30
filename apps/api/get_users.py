import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.task import Task
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.email} (ID: {u.id}, Name: {u.full_name})")
            
            res2 = await db.execute(select(Task).where(Task.user_id == u.id))
            tasks = res2.scalars().all()
            print(f"  Tasks: {len(tasks)}")

asyncio.run(main())
