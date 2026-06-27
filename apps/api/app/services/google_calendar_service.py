
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class MockGoogleCalendarService:
    """
    A mock implementation of a Google Calendar Service.
    Once real credentials are provided, this class will be replaced with actual
    google-api-python-client calls.
    """
    
    def __init__(self):
        self.mock_events = []
    
    def get_free_time_slots(self, date_str: str) -> str:
        """
        Simulates fetching free time blocks from the user's Google Calendar.
        """
        logger.info(f"Fetching free time slots for date: {date_str}")
        return (
            f"Based on your Google Calendar for {date_str}, you are completely free from "
            "10:00 AM to 12:00 PM, and from 2:00 PM to 5:00 PM. "
            "You have a meeting from 12:00 PM to 2:00 PM."
        )
    
    def schedule_event(self, title: str, start_time: str, end_time: str) -> str:
        """
        Simulates creating an event on the user's Google Calendar.
        """
        logger.info(f"Scheduling event '{title}' from {start_time} to {end_time}")
        event = {
            "title": title,
            "start_time": start_time,
            "end_time": end_time,
            "status": "confirmed",
            "htmlLink": f"https://calendar.google.com/calendar/r/eventedit?text={title.replace(' ', '+')}"
        }
        self.mock_events.append(event)
        return (
            f"Successfully scheduled '{title}' from {start_time} to {end_time} "
            f"on your Google Calendar. Event Link: {event['htmlLink']}"
        )

calendar_service = MockGoogleCalendarService()
