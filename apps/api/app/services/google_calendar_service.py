import logging
from datetime import datetime, timedelta, timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.core.config import settings

logger = logging.getLogger(__name__)

class GoogleCalendarService:
    def __init__(self, refresh_token: str):
        self.refresh_token = refresh_token
        self.credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=settings.GOOGLE_SCOPES
        )
        self.service = build('calendar', 'v3', credentials=self.credentials)

    def get_free_time_slots(self, date_str: str) -> str:
        """
        Fetches events from the user's Google Calendar and identifies free time blocks.
        """
        if not self.refresh_token:
            return "Error: User has not connected their Google Calendar."

        logger.info(f"Fetching calendar events to determine free time for date: {date_str}")
        
        try:
            # Parse date or use today
            if date_str.lower() == 'today':
                date_obj = datetime.now(timezone.utc)
            else:
                try:
                    date_obj = datetime.fromisoformat(date_str)
                except ValueError:
                    date_obj = datetime.now(timezone.utc)

            # Look at a 24-hour window
            time_min = date_obj.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
            time_max = (date_obj + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

            events_result = self.service.events().list(
                calendarId='primary', 
                timeMin=time_min,
                timeMax=time_max, 
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])

            if not events:
                return f"Based on your Google Calendar for {date_str}, you have no events scheduled. You are completely free."
            
            schedule_text = f"Here are your scheduled events on {date_str}:\n"
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                summary = event.get('summary', 'Busy')
                schedule_text += f"- {summary} from {start} to {end}\n"
                
            schedule_text += "\nAssume any time outside these events is free."
            return schedule_text
            
        except Exception as e:
            logger.error(f"Failed to fetch calendar events: {e}")
            return "Failed to fetch calendar events due to an error."
    
    def schedule_event(self, title: str, start_time: str, end_time: str) -> str:
        """
        Creates an event on the user's Google Calendar.
        """
        if not self.refresh_token:
            return "Error: User has not connected their Google Calendar."

        logger.info(f"Scheduling event '{title}' from {start_time} to {end_time}")
        
        try:
            # Format times for Google Calendar API
            # Note: Gemini should provide ISO 8601 strings
            try:
                start_dt = datetime.fromisoformat(start_time)
                end_dt = datetime.fromisoformat(end_time)
            except ValueError:
                # Fallback if AI provides a weird format
                start_dt = datetime.now(timezone.utc) + timedelta(hours=1)
                end_dt = start_dt + timedelta(hours=1)
                
            event_body = {
                'summary': title,
                'start': {
                    'dateTime': start_dt.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_dt.isoformat(),
                    'timeZone': 'UTC',
                },
            }
            
            event = self.service.events().insert(calendarId='primary', body=event_body).execute()
            
            return f"Successfully scheduled '{title}' from {start_dt.isoformat()} to {end_dt.isoformat()} on your Google Calendar. Event Link: {event.get('htmlLink')}"
            
        except Exception as e:
            logger.error(f"Failed to schedule event: {e}")
            return "Failed to schedule the event due to an error."
