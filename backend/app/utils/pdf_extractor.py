import os
import re
from typing import Dict, List, Tuple
from pypdf import PdfReader


def extract_document_content(file_path: str) -> Tuple[str, int, List[Dict[str, any]]]:
    """
    Extracts text and page metadata from a PDF or text file.
    Returns:
        full_text: Text formatted with page markers
        page_count: Number of pages
        pages: List of dicts with page_number and text
    """
    ext = os.path.splitext(file_path)[1].lower()
    pages_data: List[Dict[str, any]] = []

    if ext == ".pdf":
        try:
            reader = PdfReader(file_path)
            page_count = len(reader.pages)
            full_text_parts = []

            for idx, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                # Clean up excess whitespace
                clean_text = re.sub(r"\n{3,}", "\n\n", page_text.strip())
                pages_data.append({
                    "page_number": idx,
                    "text": clean_text,
                })
                full_text_parts.append(f"--- Page {idx} ---\n{clean_text}")

            full_text = "\n\n".join(full_text_parts)
            return full_text, max(page_count, 1), pages_data
        except Exception as e:
            # If PDF parsing fails, return empty fallback
            return f"Error extracting PDF: {str(e)}", 1, [{"page_number": 1, "text": ""}]
    else:
        # Text/Markdown/Other plain text files
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            # Divide into simulated pages (approx 500 words per page)
            words = content.split()
            words_per_page = 500
            simulated_pages = []
            full_text_parts = []

            if not words:
                simulated_pages.append({"page_number": 1, "text": ""})
                return "", 1, simulated_pages

            total_pages = max(1, (len(words) + words_per_page - 1) // words_per_page)
            for p in range(total_pages):
                page_words = words[p * words_per_page : (p + 1) * words_per_page]
                p_text = " ".join(page_words)
                simulated_pages.append({"page_number": p + 1, "text": p_text})
                full_text_parts.append(f"--- Page {p + 1} ---\n{p_text}")

            return "\n\n".join(full_text_parts), total_pages, simulated_pages
        except Exception as e:
            return f"Error reading file: {str(e)}", 1, [{"page_number": 1, "text": ""}]


def format_file_size(num_bytes: int) -> str:
    """Formats raw byte count into human-readable string like '18.4 MB' or '450 KB'."""
    for unit in ["B", "KB", "MB", "GB"]:
        if num_bytes < 1024.0:
            return f"{num_bytes:.1f} {unit}" if unit in ["MB", "GB"] else f"{int(num_bytes)} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.1f} TB"
