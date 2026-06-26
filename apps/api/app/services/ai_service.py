import os
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
from datetime import datetime

# Assuming GEMINI_API_KEY is available in the environment variables
# If not, this service will raise an error during instantiation or execution

class ExtractedTaskData(BaseModel):
    title: str = Field(description="The name of the task")
    deadline: str = Field(description="The deadline of the task in ISO format, if mentioned, else empty string")
    estimated_duration_minutes: int = Field(description="Estimated duration in minutes")
    difficulty: str = Field(description="Difficulty level: LOW, MEDIUM, or HIGH")
    priority: str = Field(description="Priority: LOW, MEDIUM, HIGH, or URGENT")
    risk_score: float = Field(description="Risk score between 0.0 and 1.0 indicating chance of missing deadline")

class AIService:
    def __init__(self):
        # We use gemini-2.5-flash as requested by the user
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.environ.get("GEMINI_API_KEY", "dummy_key")
        )
        self.structured_llm = self.llm.with_structured_output(ExtractedTaskData)

    def extract_task_details(self, user_input: str) -> ExtractedTaskData:
        prompt_template = """
        You are an AI Productivity Assistant for the 'Aheadly' platform.
        Extract task details from the following user input:
        "{user_input}"
        """
        
        prompt = PromptTemplate.from_template(prompt_template)
        formatted_prompt = prompt.format(user_input=user_input)
        
        return self.structured_llm.invoke(formatted_prompt)

    def generate_daily_schedule(self, tasks: list, calendar_events: list, working_hours: str) -> str:
        # Placeholder for Smart Daily Planner algorithm
        prompt = f"Plan a schedule for these tasks: {tasks} avoiding {calendar_events} within {working_hours}"
        return self.llm.invoke(prompt).content

    def chat_response(self, user_query: str, context: str) -> str:
        prompt = f"Context: {context}\nUser: {user_query}\nAI Assistant:"
        return self.llm.invoke(prompt).content

ai_service = AIService()
