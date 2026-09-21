import re
import json
import logging
import httpx
from typing import Dict, List, Optional, Tuple
from app.config import settings
from app.models.document import Document
from app.schemas.chat import SourceItem

logger = logging.getLogger(__name__)


def parse_pages_from_content(content_text: str) -> List[Dict[str, any]]:
    """Splits document content into page-indexed blocks."""
    if not content_text:
        return []

    # Regex matches '--- Page X ---'
    pattern = r"--- Page (\d+) ---\n"
    parts = re.split(pattern, content_text)

    pages = []
    # If content does not contain markers
    if len(parts) <= 1:
        pages.append({"page": 1, "text": content_text.strip(), "title": "Document Content"})
        return pages

    # parts[0] is header or empty, parts[1] is page 1, parts[2] is text, etc.
    i = 1
    while i < len(parts) - 1:
        page_num = int(parts[i])
        page_text = parts[i + 1].strip()

        # Try to find a header/title in the first 1-2 lines
        lines = [line.strip() for line in page_text.split("\n") if line.strip()]
        title = lines[0][:40] if lines else f"Page {page_num}"

        pages.append({
            "page": page_num,
            "text": page_text,
            "title": title,
        })
        i += 2

    return pages


def score_text_relevance(query: str, text: str) -> float:
    """Calculates relevance score using word overlap and phrase matching."""
    if not text:
        return 0.0

    # Tokenize words
    query_tokens = [w.lower() for w in re.findall(r"\b\w{3,}\b", query)]
    if not query_tokens:
        return 0.1

    text_lower = text.lower()
    score = 0.0

    # Exact phrase matches
    if query.lower() in text_lower:
        score += 5.0

    # Word matches
    for token in query_tokens:
        count = text_lower.count(token)
        if count > 0:
            score += 1.0 + min(count * 0.2, 2.0)

    # Normalize by page length to prevent bias toward giant pages
    length_penalty = max(1.0, len(text.split()) / 200.0)
    return score / length_penalty


def retrieve_relevant_pages(query: str, pages: List[Dict[str, any]], top_k: int = 3) -> List[Dict[str, any]]:
    """Scores all pages and returns the top_k most relevant."""
    scored_pages = []
    for page in pages:
        s = score_text_relevance(query, page["text"])
        scored_pages.append((s, page))

    scored_pages.sort(key=lambda x: x[0], reverse=True)
    # Filter pages with at least some relevance, or fallback to first page if nothing matches
    top = [p for s, p in scored_pages[:top_k] if s > 0.0]
    if not top and pages:
        top = [pages[0]]
    return top


async def call_groq_api(
    api_key: str,
    system_prompt: str,
    user_prompt: str,
    model: str = "openai/gpt-oss-120b",
) -> Optional[str]:
    """Calls Groq Cloud API for answer generation."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 1500,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            try:
                return data["choices"][0]["message"]["content"]
            except (KeyError, IndexError):
                return None
        else:
            logger.warning(f"Groq API call failed with status {resp.status_code}: {resp.text}")
    return None


async def call_gemini_api(api_key: str, prompt: str) -> Optional[str]:
    """Calls Google Gemini API for answer generation."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024},
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError):
                return None
    return None


async def call_openai_api(api_key: str, system_prompt: str, user_prompt: str) -> Optional[str]:
    """Calls OpenAI API for answer generation."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            try:
                return data["choices"][0]["message"]["content"]
            except (KeyError, IndexError):
                return None
    return None


def generate_local_extractive_answer(
    question: str,
    relevant_pages: List[Dict[str, any]],
    document_name: str,
) -> Tuple[str, List[SourceItem]]:
    """
    Intelligent local RAG engine when external LLM API is unavailable.
    Synthesizes sentences matching query keywords with cited page numbers.
    """
    query_words = set([w.lower() for w in re.findall(r"\b\w{3,}\b", question)])
    found_sentences = []
    sources = []

    for page in relevant_pages:
        page_num = page["page"]
        title = page.get("title", f"Page {page_num}")
        text = page["text"]

        # Split text into sentences
        sentences = re.split(r"(?<=[.!?])\s+", text)
        page_best_sentences = []

        for sent in sentences:
            sent_clean = sent.strip()
            if len(sent_clean) < 20:
                continue
            # Calculate match
            sent_words = set([w.lower() for w in re.findall(r"\b\w{3,}\b", sent_clean)])
            overlap = len(query_words.intersection(sent_words))
            if overlap > 0:
                page_best_sentences.append((overlap, sent_clean))

        page_best_sentences.sort(key=lambda x: x[0], reverse=True)

        if page_best_sentences:
            top_sents = [s for _, s in page_best_sentences[:2]]
            found_sentences.extend([(page_num, s) for s in top_sents])
            snippet = top_sents[0][:120] + ("..." if len(top_sents[0]) > 120 else "")
            sources.append(SourceItem(page=page_num, title=title, snippet=snippet))

    if not found_sentences:
        # If no direct keyword match, provide general document overview from first relevant page
        p = relevant_pages[0] if relevant_pages else {"page": 1, "title": "Overview", "text": ""}
        text_preview = p["text"][:350]
        if text_preview:
            answer = (
                f"Based on **{document_name}**, here is the relevant section regarding your question:\n\n"
                f"> \"{text_preview.strip()}...\"\n\n"
                f"You can review the full details on **Page {p['page']}**."
            )
            sources = [SourceItem(page=p["page"], title=p.get("title", f"Page {p['page']}"), snippet=text_preview[:120])]
            return answer, sources
        else:
            return "I couldn't find specific information about that in the document. Please try rephrasing your question.", []

    # Format synthesized answer
    grouped_by_page: Dict[int, List[str]] = {}
    for p_num, sent in found_sentences:
        grouped_by_page.setdefault(p_num, []).append(sent)

    answer_parts = [f"Based on **{document_name}**, here are the key findings:\n"]
    for p_num, sents in grouped_by_page.items():
        bullet_points = "\n".join([f"- {s}" for s in sents])
        answer_parts.append(f"**From Page {p_num}:**\n{bullet_points}\n")

    return "\n".join(answer_parts), sources


async def answer_document_question(
    document: Document,
    question: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
    mode: str = "moderate",
) -> Tuple[str, List[SourceItem]]:
    """
    Coordinates RAG: retrieves relevant pages, queries LLM if available, or uses local synthesis.
    Supports:
      - 'strict': Answers strictly and exclusively from document excerpts.
      - 'moderate': Uses document as primary anchor, supplementing with general AI knowledge if needed.
    """
    content = document.content_text or ""
    pages = parse_pages_from_content(content)

    if not pages:
        return "The document does not appear to contain readable text.", []

    relevant_pages = retrieve_relevant_pages(question, pages, top_k=3)

    # Check for external AI keys
    groq_key = settings.GROQ_API_KEY
    api_key = settings.GEMINI_API_KEY or settings.AI_API_KEY
    openai_key = settings.OPENAI_API_KEY

    context_str = "\n\n".join(
        [f"[Page {p['page']} - {p.get('title', '')}]\n{p['text']}" for p in relevant_pages]
    )

    sources = [
        SourceItem(
            page=p["page"],
            title=p.get("title", f"Page {p['page']}"),
            snippet=p["text"][:120] + ("..." if len(p["text"]) > 120 else ""),
            document_id=document.id,
            document_name=document.filename,
        )
        for p in relevant_pages
    ]

    is_strict = (mode or "strict").lower() == "strict"

    if is_strict:
        sys_prompt = (
            f"You are DocuMind in STRICT MODE.\n"
            f"You are an expert document assistant analyzing '{document.filename}'.\n"
            f"STRICT MODE RULES:\n"
            f"1. You MUST answer the user's question using ONLY the provided document excerpts below.\n"
            f"2. If the answer or relevant information is NOT present in the provided document excerpts, state clearly: "
            f"\"This information is not found in {document.filename}.\"\n"
            f"3. Do NOT use external knowledge, do NOT extrapolate beyond what is explicitly stated in the document.\n"
            f"4. Always cite the exact page number(s) where information was found (e.g. `[Page X]`).\n"
            f"5. Format your answer cleanly with Markdown."
        )
    else:
        sys_prompt = (
            f"You are DocuMind in MODERATE MODE.\n"
            f"You are an intelligent study assistant analyzing '{document.filename}'.\n"
            f"MODERATE MODE RULES:\n"
            f"1. Primary Anchor: First look for and cite any relevant information, concepts, or context found in the excerpts from '{document.filename}' (citing page numbers like `[Page X]`).\n"
            f"2. Supplementary Knowledge: If the document does not contain enough data, only mentions the topic briefly, or doesn't fully answer the question, supplement and expand using your broader knowledge to provide a comprehensive, clear, and accurate answer.\n"
            f"3. Clear Attribution: Distinguish what comes from the document vs. your supplementary explanation (e.g., using sections like '**From the Document (Page X):**' and '**Additional Context & Explanation:**').\n"
            f"4. Format your answer cleanly with Markdown headings, bullet points, and bold text."
        )

    # Try Groq if key configured
    if groq_key:
        user_prompt = f"--- Document Excerpts ---\n{context_str}\n\n--- User Question ---\n{question}"
        try:
            ai_ans = await call_groq_api(groq_key, sys_prompt, user_prompt, model=settings.GROQ_MODEL)
            if ai_ans:
                return ai_ans.strip(), sources
        except Exception:
            pass

    # Try Gemini if key configured
    if api_key:
        prompt = (
            f"{sys_prompt}\n\n"
            f"--- Document Excerpts ---\n{context_str}\n\n"
            f"--- User Question ---\n{question}"
        )
        try:
            ai_ans = await call_gemini_api(api_key, prompt)
            if ai_ans:
                return ai_ans.strip(), sources
        except Exception:
            pass

    # Try OpenAI if key configured
    if openai_key:
        user_prompt = f"Context:\n{context_str}\n\nQuestion: {question}"
        try:
            ai_ans = await call_openai_api(openai_key, sys_prompt, user_prompt)
            if ai_ans:
                return ai_ans.strip(), sources
        except Exception:
            pass

    # High quality local fallback
    return generate_local_extractive_answer(question, relevant_pages, document.filename)


async def answer_multi_document_question(
    documents: List[Document],
    question: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
    mode: str = "moderate",
) -> Tuple[str, List[SourceItem]]:
    """
    Coordinates Multi-Document RAG: retrieves relevant pages across multiple documents,
    queries LLM with cross-document context, and cites specific documents and pages.
    """
    if not documents:
        return "No documents provided.", []

    if len(documents) == 1:
        return await answer_document_question(documents[0], question, chat_history, mode)

    sources: List[SourceItem] = []
    doc_names = [d.filename for d in documents]
    docs_summary = ", ".join([f"'{d.filename}'" for d in documents])

    # Retrieve top relevant pages from each document
    pages_per_doc = max(1, min(3, 6 // len(documents)))
    context_sections = []

    for doc in documents:
        content = doc.content_text or ""
        pages = parse_pages_from_content(content)
        if not pages:
            continue
        rel_pages = retrieve_relevant_pages(question, pages, top_k=pages_per_doc)
        for p in rel_pages:
            sources.append(
                SourceItem(
                    page=p["page"],
                    title=p.get("title", f"Page {p['page']}"),
                    snippet=p["text"][:120] + ("..." if len(p["text"]) > 120 else ""),
                    document_id=doc.id,
                    document_name=doc.filename,
                )
            )
            context_sections.append(
                f"[Document: {doc.filename} | Page {p['page']} - {p.get('title', '')}]\n{p['text']}"
            )

    if not context_sections:
        return "None of the selected documents appear to contain readable text.", []

    context_str = "\n\n".join(context_sections)

    # Check for external AI keys
    groq_key = settings.GROQ_API_KEY
    api_key = settings.GEMINI_API_KEY or settings.AI_API_KEY
    openai_key = settings.OPENAI_API_KEY

    is_strict = (mode or "strict").lower() == "strict"

    if is_strict:
        sys_prompt = (
            f"You are DocuMind in STRICT MULTI-DOCUMENT MODE.\n"
            f"You are an expert document assistant analyzing multiple documents: {docs_summary}.\n"
            f"STRICT MODE RULES:\n"
            f"1. You MUST answer the user's question using ONLY the provided document excerpts below.\n"
            f"2. If the answer is NOT present in any of the excerpts, state clearly: "
            f"\"This information is not found in the selected documents ({docs_summary}).\"\n"
            f"3. Do NOT use external knowledge. Do NOT extrapolate.\n"
            f"4. Always cite the exact document name and page number for every point (e.g. `[{doc_names[0]}, Page X]`).\n"
            f"5. Format your answer cleanly with Markdown."
        )
    else:
        sys_prompt = (
            f"You are DocuMind in MODERATE MULTI-DOCUMENT MODE.\n"
            f"You are an intelligent study assistant analyzing multiple documents: {docs_summary}.\n"
            f"MODERATE MODE RULES:\n"
            f"1. Primary Anchor: Cross-reference and synthesize relevant findings from the provided document excerpts, citing each document and page (e.g. `[{doc_names[0]}, Page X]`).\n"
            f"2. Compare & Contrast: If documents discuss related, complementary, or differing points, highlight connections between them.\n"
            f"3. Supplementary Knowledge: If the documents do not provide enough detail, supplement with broader knowledge while clearly indicating what is from the documents vs. additional explanation.\n"
            f"4. Format cleanly with Markdown headings, bullet points, and comparison tables where helpful."
        )

    # Try Groq if key configured
    if groq_key:
        user_prompt = f"--- Multi-Document Excerpts ---\n{context_str}\n\n--- User Question ---\n{question}"
        try:
            ai_ans = await call_groq_api(groq_key, sys_prompt, user_prompt, model=settings.GROQ_MODEL)
            if ai_ans:
                return ai_ans.strip(), sources
        except Exception:
            pass

    # Try Gemini if key configured
    if api_key:
        prompt = (
            f"{sys_prompt}\n\n"
            f"--- Multi-Document Excerpts ---\n{context_str}\n\n"
            f"--- User Question ---\n{question}"
        )
        try:
            ai_ans = await call_gemini_api(api_key, prompt)
            if ai_ans:
                return ai_ans.strip(), sources
        except Exception:
            pass

    # Try OpenAI if key configured
    if openai_key:
        user_prompt = f"Context:\n{context_str}\n\nQuestion: {question}"
        try:
            ai_ans = await call_openai_api(openai_key, sys_prompt, user_prompt)
            if ai_ans:
                return ai_ans.strip(), sources
        except Exception:
            pass

    # Local fallback: synthesize from all retrieved pages
    sents_output = [f"### Key Findings Across Selected Documents ({len(documents)} PDFs):\n"]
    for s in sources:
        sents_output.append(f"- **{s.document_name} (Page {s.page}):** {s.snippet}")
    return "\n".join(sents_output), sources
