import os
import json
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from app.services.google_calendar_service import GoogleCalendarService

class ExtractedTaskData(BaseModel):
    title: str = Field(description="The name of the task")
    deadline: str = Field(description="The deadline of the task in ISO format, if mentioned, else empty string")
    estimated_duration_minutes: int = Field(description="Estimated duration in minutes")
    difficulty: str = Field(description="Difficulty level: LOW, MEDIUM, or HIGH")
    priority: str = Field(description="Priority: LOW, MEDIUM, HIGH, or URGENT")
    risk_score: float = Field(description="Risk score between 0.0 and 1.0 indicating chance of missing deadline")

from dotenv import load_dotenv
load_dotenv("../../.env")
load_dotenv(".env") # fallback

class AIService:
    def __init__(self):
        # We use gemini-2.5-flash natively via google-genai
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key)

    def extract_task_details(self, user_input: str) -> ExtractedTaskData:
        prompt = f"""
        You are an AI Productivity Assistant for the 'Aheadly' platform.
        Extract task details from the following user input:
        "{user_input}"
        """
        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExtractedTaskData,
                temperature=0.1,
            ),
        )
        data = json.loads(response.text)
        return ExtractedTaskData(**data)

    def generate_daily_schedule(self, tasks: list, calendar_events: list, working_hours: str) -> str:
        prompt = f"Plan a schedule for these tasks: {tasks} avoiding {calendar_events} within {working_hours}"
        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text

    def chat_response_stream(self, user_query: str, context: str, refresh_token: str = None):
        prompt = f"System Context: {context}\n\nUser Message: {user_query}"
        
        # Instantiate real calendar service with user's refresh token
        calendar_service = GoogleCalendarService(refresh_token=refresh_token)

        # Create wrapper functions so Gemini can call them without passing user ID
        def schedule_google_calendar_event(title: str, start_time: str, end_time: str) -> str:
            """
            Schedules an event on the user's Google Calendar.
            
            Args:
                title: The title of the event or task.
                start_time: The start time (e.g. '2026-06-27T10:00:00Z').
                end_time: The end time (e.g. '2026-06-27T12:00:00Z').
            """
            return calendar_service.schedule_event(title, start_time, end_time)

        def get_free_google_calendar_time(date_str: str) -> str:
            """
            Fetches the free time slots on the user's Google Calendar for a specific date.
            
            Args:
                date_str: The date to check for free time (e.g. 'today' or '2026-06-27').
            """
            return calendar_service.get_free_time_slots(date_str)

        chat = self.client.chats.create(
            model='gemini-2.5-flash',
            config=types.GenerateContentConfig(
                tools=[schedule_google_calendar_event, get_free_google_calendar_time],
                temperature=0.1,
            )
        )
        response = chat.send_message_stream(prompt)
        for chunk in response:
            if chunk.text:
                yield chunk.text

ai_service = AIService()
