from fastapi import APIRouter

from backend.models.chat import ChatRequest, ChatResponse
from backend.controllers.chat_controller import handle_chat_request
from backend.controllers.profile_controller import handle_profile_request


router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
def ask_question(request: ChatRequest):
    return handle_chat_request(request)


@router.get("/profile")
def get_profile():
    return handle_profile_request()