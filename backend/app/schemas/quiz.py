from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class QuizGenerateRequest(BaseModel):
    document_id: str
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")


class QuizQuestionFrontend(BaseModel):
    id: str
    order: int
    question: str
    options: List[str]  # 4 options: ["Option A text", "Option B text", ...]
    # Note: correct_answer and explanation are deliberately omitted here to prevent answer leakage!


class QuizResponse(BaseModel):
    quiz_id: str
    document_id: str
    document_name: str
    difficulty: str
    question_count: int
    questions: List[QuizQuestionFrontend]


class AnswerItem(BaseModel):
    question_id: str
    user_answer: str = Field(..., pattern="^[A-D]$")


class QuizSubmitRequest(BaseModel):
    answers: List[AnswerItem]


class SingleAnswerRequest(BaseModel):
    question_id: str
    user_answer: str = Field(..., pattern="^[A-D]$")


class SingleAnswerResponse(BaseModel):
    question_id: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str


class QuestionReviewItem(BaseModel):
    id: str
    order: int
    question: str
    options: List[str]
    user_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool
    explanation: str


class QuizResultResponse(BaseModel):
    quiz_id: str
    document_id: str
    document_name: str
    difficulty: str
    score: int
    total: int
    percentage: float
    correct_count: int
    incorrect_count: int
    questions: List[QuestionReviewItem]


class QuizHistoryItem(BaseModel):
    id: str
    document_id: str
    document_name: str
    difficulty: str
    question_count: int
    score: int
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
