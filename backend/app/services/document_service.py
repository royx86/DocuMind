import os
import uuid
import aiofiles
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.models.document import Document
from app.utils.pdf_extractor import extract_document_content, format_file_size


async def save_and_process_document(
    db: AsyncSession,
    user_id: str,
    file: UploadFile,
) -> Document:
    # Validate extension
    filename = file.filename or "document.pdf"
    ext = os.path.splitext(filename)[1].lower()
    allowed_extensions = [".pdf", ".txt", ".md", ".csv", ".json", ".doc", ".docx"]
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(allowed_extensions)}",
        )

    # Generate safe unique filename
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    saved_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    # Read and save file content
    content = await file.read()
    file_size_bytes = len(content)

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB.",
        )

    with open(saved_path, "wb") as f:
        f.write(content)

    # Extract text and page count
    try:
        extracted_text, page_count, _ = extract_document_content(saved_path)
        doc_status = "ready"
    except Exception as e:
        extracted_text = f"Extraction error: {str(e)}"
        page_count = 1
        doc_status = "failed"

    formatted_size = format_file_size(file_size_bytes)

    doc = Document(
        user_id=user_id,
        filename=filename,
        file_path=saved_path,
        file_size=formatted_size,
        page_count=page_count,
        status=doc_status,
        content_text=extracted_text,
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return doc


async def get_user_documents(db: AsyncSession, user_id: str) -> List[Document]:
    result = await db.execute(
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
    )
    return result.scalars().all()


async def get_document_by_id(
    db: AsyncSession,
    doc_id: str,
    user_id: str,
) -> Document:
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )
    return doc


async def delete_document(
    db: AsyncSession,
    doc_id: str,
    user_id: str,
) -> bool:
    doc = await get_document_by_id(db, doc_id, user_id)
    # Remove file from disk if it exists
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass

    await db.delete(doc)
    await db.flush()
    return True
