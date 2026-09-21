import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatMessage,
    ConversationResponse,
    SourceItem,
)
from app.services.auth_service import get_current_user
from app.services.rag_service import answer_document_question, answer_multi_document_question

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/{document_id}", response_model=ChatResponse)
async def chat_with_document(
    document_id: str,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_multi = (request.document_ids and len(request.document_ids) > 1) or document_id == "multi"

    if is_multi and request.document_ids:
        docs_res = await db.execute(
            select(Document).where(Document.id.in_(request.document_ids), Document.user_id == current_user.id)
        )
        documents = list(docs_res.scalars().all())
        if not documents:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching documents found.")
        document = documents[0]  # Primary document for conversation relationship
    else:
        target_id = document_id if document_id != "multi" else (request.document_ids[0] if request.document_ids else None)
        if not target_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No document specified.")
        doc_res = await db.execute(
            select(Document).where(Document.id == target_id, Document.user_id == current_user.id)
        )
        document = doc_res.scalar_one_or_none()
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
        documents = [document]

    # Find or create conversation
    conversation = None
    if request.conversation_id:
        conv_res = await db.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = conv_res.scalar_one_or_none()

    if not conversation:
        # Create new conversation with title derived from user question
        title = request.message[:45].strip() + ("..." if len(request.message) > 45 else "")
        if is_multi and len(documents) > 1:
            title = f"Multi-doc ({len(documents)} docs): {title}"
        conversation = Conversation(
            user_id=current_user.id,
            document_id=document.id,
            title=title or "Document Chat",
        )
        db.add(conversation)
        await db.flush()
        await db.refresh(conversation)

    # Save User message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)
    await db.flush()
    await db.refresh(user_msg)

    # Generate answer with RAG (multi-document or single document)
    if is_multi and len(documents) > 1:
        answer_text, sources = await answer_multi_document_question(
            documents=documents,
            question=request.message,
            mode=request.mode or "moderate",
        )
    else:
        answer_text, sources = await answer_document_question(
            document=document,
            question=request.message,
            mode=request.mode or "moderate",
        )

    sources_json = json.dumps([s.model_dump() for s in sources]) if sources else None

    # Save Assistant message
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer_text,
        sources=sources_json,
    )
    db.add(assistant_msg)
    await db.flush()
    await db.refresh(assistant_msg)

    return ChatResponse(
        conversation_id=conversation.id,
        user_message=ChatMessage(
            id=user_msg.id,
            role=user_msg.role,
            content=user_msg.content,
            sources=[],
            created_at=user_msg.created_at,
        ),
        assistant_message=ChatMessage(
            id=assistant_msg.id,
            role=assistant_msg.role,
            content=assistant_msg.content,
            sources=sources,
            created_at=assistant_msg.created_at,
            mode=request.mode or "moderate",
        ),
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Conversation, Document.filename)
        .join(Document, Conversation.document_id == Document.id)
        .where(Conversation.user_id == current_user.id)
        .options(selectinload(Conversation.messages))
        .order_by(Conversation.updated_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    convs = []
    for conv, doc_name in rows:
        last_msg = conv.messages[-1].content if conv.messages else None
        if last_msg and len(last_msg) > 90:
            last_msg = last_msg[:90] + "..."
        convs.append(
            ConversationResponse(
                id=conv.id,
                document_id=conv.document_id,
                document_name=doc_name,
                title=conv.title,
                last_message=last_msg,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
            )
        )
    return convs


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Conversation, Document.filename)
        .join(Document, Conversation.document_id == Document.id)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .options(selectinload(Conversation.messages))
    )
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    conv, doc_name = row
    messages_out = []
    for m in conv.messages:
        sources_list = []
        if m.sources:
            try:
                raw_sources = json.loads(m.sources)
                sources_list = [SourceItem(**s) for s in raw_sources]
            except Exception:
                pass

        messages_out.append(
            ChatMessage(
                id=m.id,
                role=m.role,
                content=m.content,
                sources=sources_list,
                created_at=m.created_at,
            )
        )

    last_msg = conv.messages[-1].content if conv.messages else None
    return ConversationResponse(
        id=conv.id,
        document_id=conv.document_id,
        document_name=doc_name,
        title=conv.title,
        last_message=last_msg,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages_out,
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    await db.delete(conv)
    await db.flush()
    return {"message": "Conversation deleted successfully"}
