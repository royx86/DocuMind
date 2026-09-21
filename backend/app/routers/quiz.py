from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.quiz import (
    QuizGenerateRequest,
    QuizResponse,
    SingleAnswerRequest,
    SingleAnswerResponse,
    QuizSubmitRequest,
    QuizResultResponse,
    QuizHistoryItem,
)
from app.services.auth_service import get_current_user
from app.services.quiz_service import (
    generate_quiz,
    submit_single_answer,
    submit_quiz,
    get_quiz_history,
    get_quiz_by_id,
)

router = APIRouter(prefix="/quiz", tags=["Quiz"])


@router.post("/generate", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    request: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc_res = await db.execute(
        select(Document).where(Document.id == request.document_id, Document.user_id == current_user.id)
    )
    document = doc_res.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    return await generate_quiz(
        db=db,
        document=document,
        user_id=current_user.id,
        question_count=request.question_count,
        difficulty=request.difficulty,
    )


@router.post("/{quiz_id}/answer", response_model=SingleAnswerResponse)
async def answer_question(
    quiz_id: str,
    request: SingleAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await submit_single_answer(
        db=db,
        quiz_id=quiz_id,
        user_id=current_user.id,
        question_id=request.question_id,
        user_answer=request.user_answer,
    )


@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
async def finish_quiz(
    quiz_id: str,
    request: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await submit_quiz(
        db=db,
        quiz_id=quiz_id,
        user_id=current_user.id,
        answers=request.answers,
    )


@router.get("/history", response_model=List[QuizHistoryItem])
async def list_quiz_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_quiz_history(db=db, user_id=current_user.id)


@router.get("/{quiz_id}", response_model=QuizResultResponse)
async def get_quiz(
    quiz_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_quiz_by_id(db=db, quiz_id=quiz_id, user_id=current_user.id)
