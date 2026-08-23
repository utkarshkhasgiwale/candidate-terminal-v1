from pydantic import BaseModel


class HistoryEntry(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    history: list[HistoryEntry]


class ChatResponse(BaseModel):
    answer: str
    mentioned_project: str | None