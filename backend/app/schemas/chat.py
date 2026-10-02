from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class SourceItem(BaseModel):
    page: int
    title: Optional[str] = None
    snippet: Optional[str] = None
    document_id: Optional[str] = None
    document_name: Optional[str] = None


class ChatMessage(BaseModel):
    id: str
    role: str  # user, assistant, system
    content: str
    sources: List[SourceItem] = []
    created_at: datetime
    mode: Optional[str] = None

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    mode: Optional[str] = "moderate"  # "strict" or "moderate"
    document_ids: Optional[List[str]] = None


class ChatResponse(BaseModel):
    conversation_id: str
    user_message: ChatMessage
    assistant_message: ChatMessage


class ConversationResponse(BaseModel):
    id: str
    document_id: str
    document_name: str
    title: str
    last_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[ChatMessage]] = None

    class Config:
        from_attributes = True
