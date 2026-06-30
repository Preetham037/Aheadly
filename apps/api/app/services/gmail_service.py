import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.core.config import settings
import base64

class GmailService:
    def __init__(self):
        self.scopes = ["https://www.googleapis.com/auth/gmail.readonly"]

    def _get_credentials(self, refresh_token: str):
        return Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=self.scopes
        )

    def fetch_recent_emails(self, refresh_token: str, max_results: int = 5):
        try:
            creds = self._get_credentials(refresh_token)
            service = build('gmail', 'v1', credentials=creds)

            # Call the Gmail API to fetch INBOX
            results = service.users().messages().list(userId='me', labelIds=['INBOX'], maxResults=max_results).execute()
            messages = results.get('messages', [])

            if not messages:
                return "You have no recent emails in your inbox."

            email_summaries = []
            for msg in messages:
                # Fetch full message payload
                msg_data = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                headers = msg_data['payload'].get('headers', [])
                
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown Sender')
                snippet = msg_data.get('snippet', '')
                
                email_summaries.append({
                    "subject": subject,
                    "from": sender,
                    "snippet": snippet
                })

            return json.dumps(email_summaries, indent=2)
            
        except HttpError as error:
            print(f"An error occurred fetching emails: {error}")
            return "Failed to fetch emails from Google. Ensure you have authorized the Gmail scopes."
        except Exception as e:
            print(f"Unexpected error: {e}")
            return "An unexpected error occurred while fetching emails."

gmail_service = GmailService()
