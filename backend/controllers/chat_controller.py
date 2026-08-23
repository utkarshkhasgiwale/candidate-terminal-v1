from backend.models.chat import ChatRequest, ChatResponse
from backend.services.chat_service import get_chat_response


def handle_chat_request(request: ChatRequest) -> ChatResponse:
    return get_chat_response(request)