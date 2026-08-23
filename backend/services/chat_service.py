from ai_core.chat_ai import ask
from backend.models.chat import ChatRequest, ChatResponse


def get_chat_response(request: ChatRequest) -> ChatResponse:
    history_as_dicts = [entry.model_dump() for entry in request.history]

    result = ask(request.question, history_as_dicts)

    return ChatResponse(
        answer=result.answer,
        mentioned_project=result.mentioned_project,
    )