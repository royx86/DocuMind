from app.services.auth_service import register_user, authenticate_user, get_current_user
from app.services.document_service import (
    save_and_process_document,
    get_user_documents,
    get_document_by_id,
    delete_document,
)
from app.services.rag_service import answer_document_question
from app.services.quiz_service import (
    generate_quiz,
    submit_single_answer,
    submit_quiz,
    get_quiz_history,
    get_quiz_by_id,
)

__all__ = [
    "register_user",
    "authenticate_user",
    "get_current_user",
    "save_and_process_document",
    "get_user_documents",
    "get_document_by_id",
    "delete_document",
    "answer_document_question",
    "generate_quiz",
    "submit_single_answer",
    "submit_quiz",
    "get_quiz_history",
    "get_quiz_by_id",
]
