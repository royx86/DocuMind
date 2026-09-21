import os
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentDetailResponse
from app.services.auth_service import get_current_user, get_current_user_from_token_or_query
from app.services.document_service import (
    save_and_process_document,
    get_user_documents,
    get_document_by_id,
    delete_document,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = await get_user_documents(db, current_user.id)
    return [DocumentResponse.model_validate(d) for d in docs]


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await save_and_process_document(db, current_user.id, file)
    return DocumentResponse.model_validate(doc)


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await get_document_by_id(db, document_id, current_user.id)
    content_preview = (doc.content_text[:500] + "...") if doc.content_text else None
    return DocumentDetailResponse(
        id=doc.id,
        filename=doc.filename,
        file_size=doc.file_size,
        page_count=doc.page_count,
        status=doc.status,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        content_preview=content_preview,
    )


@router.get("/{document_id}/file")
async def get_document_file(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token_or_query),
):
    doc = await get_document_by_id(db, document_id, current_user.id)
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server.")
    
    media_type = "application/pdf" if doc.filename.lower().endswith(".pdf") else "text/plain"
    return FileResponse(
        path=doc.file_path,
        filename=doc.filename,
        media_type=media_type,
    )


@router.delete("/{document_id}")
async def remove_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_document(db, document_id, current_user.id)
    return {"message": "Document deleted successfully"}
