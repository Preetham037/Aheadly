import asyncio
import datetime
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.note import Note

async def seed_data():
    async with AsyncSessionLocal() as db:
        # Get demo user
        result = await db.execute(select(User).where(User.email == "demo@aheadly.app"))
        user = result.scalars().first()
        
        if not user:
            print("Demo user not found. Run the app and login once.")
            return

        # 1. Update user productivity stats
        user.productivity_score = 85.0
        user.streak_days = 12
        db.add(user)

        # 2. Add dummy tasks (some completed, some upcoming, some missed)
        now = datetime.datetime.now(datetime.timezone.utc)
        
        tasks = [
            # Completed Tasks
            Task(title="Finish Hackathon Presentation", status=TaskStatus.DONE, priority=TaskPriority.HIGH, user_id=user.id, deadline=now - datetime.timedelta(days=1)),
            Task(title="Record Demo Video", status=TaskStatus.DONE, priority=TaskPriority.MEDIUM, user_id=user.id, deadline=now - datetime.timedelta(hours=5)),
            
            # Missed Tasks (Overdue)
            Task(title="Submit Project on Devpost", status=TaskStatus.TODO, priority=TaskPriority.URGENT, user_id=user.id, deadline=now - datetime.timedelta(hours=2)),
            Task(title="Email Judges", status=TaskStatus.TODO, priority=TaskPriority.MEDIUM, user_id=user.id, deadline=now - datetime.timedelta(days=1)),
            
            # Upcoming Tasks
            Task(title="Celebrate Hackathon Win", status=TaskStatus.TODO, priority=TaskPriority.HIGH, user_id=user.id, deadline=now + datetime.timedelta(days=2)),
            Task(title="Sleep for 12 hours", status=TaskStatus.TODO, priority=TaskPriority.LOW, user_id=user.id, deadline=now + datetime.timedelta(days=3)),
        ]
        db.add_all(tasks)

        # 3. Add dummy notes
        notes = [
            Note(title="Hackathon Checklist", content="1. Fix bugs\n2. Polish UI\n3. Record Demo\n4. Submit before deadline!", user_id=user.id),
            Note(title="Project Idea: Aheadly", content="An AI-powered productivity assistant that actively fights procrastination by automatically scheduling your tasks and reading your emails.", user_id=user.id),
        ]
        db.add_all(notes)

        await db.commit()
        print("Successfully seeded the database with dummy data!")

if __name__ == "__main__":
    asyncio.run(seed_data())
