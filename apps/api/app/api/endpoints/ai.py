from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.models.user import User
from app.services.ai_service import ai_service, ExtractedTaskData

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    context: str = ""

class ChatResponse(BaseModel):
    response: str

class ParseTaskRequest(BaseModel):
    user_input: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    response = ai_service.chat_response(request.query, request.context)
    return {"response": response}

@router.post("/parse-task", response_model=ExtractedTaskData)
async def parse_task_from_text(
    request: ParseTaskRequest,
    current_user: User = Depends(get_current_user)
):
    extracted = ai_service.extract_task_details(request.user_input)
    return extracted
