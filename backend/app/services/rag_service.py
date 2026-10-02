import re
import json
import logging
import httpx
from typing import Dict, List, Optional, Tuple
from app.config import settings
from app.models.document import Document
from app.schemas.chat import SourceItem

from app.utils.pdf_extractor import (
    clean_document_text,
    is_header_or_footer_noise,
    is_valid_statement,
)

logger = logging.getLogger(__name__)


def extract_page_title(page_text: str, page_num: int) -> str:
    """Extracts a descriptive, clean section heading or topic title for a page."""
    lines = [l.strip() for l in page_text.split("\n") if l.strip()]
    if not lines:
        return f"Page {page_num}"

    for line in lines[:4]:
        # Section or chapter headers
        sec_m = re.match(r"^(?:SECTION|CHAPTER|PART|MODULE)\s+\d+\s*[—–-]\s*(.*?)(?:\s*\(.*?\))?$", line, re.IGNORECASE)
        if sec_m:
            return sec_m.group(1).strip()
        # Question bank titles
        q_m = re.match(r"^Q(\d+)[\.:\)]\s*(.*)", line, re.IGNORECASE)
        if q_m:
            q_text = q_m.group(2).strip()
            return f"Q{q_m.group(1)}: {q_text[:35]}..." if len(q_text) > 35 else f"Q{q_m.group(1)}: {q_text}"
        # Meaningful heading
        if (
            not re.match(r"^[A-D]\)", line)
            and not line.startswith("Answer:")
            and not line.startswith("Explanation:")
            and len(line) <= 65
            and not re.search(r"\|", line)
            and not is_header_or_footer_noise(line)
        ):
            return line

    return f"Page {page_num}"


def parse_pages_from_content(content_text: str) -> List[Dict[str, any]]:
    """Splits document content into sanitized, page-indexed blocks."""
    if not content_text:
        return []

    # Clean text to remove recurring headers and metadata
    cleaned_content = clean_document_text(content_text)

    # Regex matches '--- Page X ---'
    pattern = r"--- Page (\d+) ---\n"
    parts = re.split(pattern, cleaned_content)

    pages = []
    # If content does not contain page markers
    if len(parts) <= 1:
        text_clean = cleaned_content.strip()
        pages.append({"page": 1, "text": text_clean, "title": extract_page_title(text_clean, 1)})
        return pages

    i = 1
    while i < len(parts) - 1:
        page_num = int(parts[i])
        page_text = parts[i + 1].strip()

        # Deduplicate internal lines and strip residual header noise
        lines = [line.strip() for line in page_text.split("\n") if line.strip()]
        clean_lines = [l for l in lines if not is_header_or_footer_noise(l)]
        clean_page_str = "\n".join(clean_lines).strip()

        title = extract_page_title(clean_page_str, page_num)

        pages.append({
            "page": page_num,
            "text": clean_page_str,
            "title": title,
        })
        i += 2

    return pages


def score_text_relevance(query: str, text: str) -> float:
    """Calculates relevance score using word overlap and phrase matching on clean body text."""
    if not text:
        return 0.0

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

    # Normalize by page length
    length_penalty = max(1.0, len(text.split()) / 200.0)
    return score / length_penalty


def retrieve_relevant_pages(query: str, pages: List[Dict[str, any]], top_k: int = 3) -> List[Dict[str, any]]:
    """Scores all pages and returns the top_k most relevant."""
    scored_pages = []
    for page in pages:
        s = score_text_relevance(query, page["text"])
        scored_pages.append((s, page))

    scored_pages.sort(key=lambda x: x[0], reverse=True)
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
    Synthesizes rich conceptual explanations and relevant findings with accurate citations.
    """
    query_tokens = set([w.lower() for w in re.findall(r"\b\w{3,}\b", question)])
    page_insights = []
    sources: List[SourceItem] = []

    for page in relevant_pages:
        page_num = page["page"]
        title = page.get("title", f"Page {page_num}")
        text = page["text"]

        # 1. Look for structured Question Bank / Explanation blocks
        qa_matches = re.finditer(
            r"(?:Q\d+[\.:\)]\s*(?P<q>.*?)\n.*?)?Answer:\s*(?P<ans>.*?)\n\s*(?:Explanation|Explain|Rationale)\s*:\s*(?P<expl>.*?)(?=(?:\n\s*Q\d+[\.:\)]|\n\s*SECTION|\Z))",
            text,
            re.DOTALL | re.IGNORECASE,
        )
        page_qa_hits = []
        for m in qa_matches:
            q_clean = " ".join(m.group("q").split()) if m.group("q") else ""
            ans_clean = " ".join(m.group("ans").split()) if m.group("ans") else ""
            expl_clean = " ".join(m.group("expl").split()) if m.group("expl") else ""
            combined = f"{q_clean} {ans_clean} {expl_clean}".lower()
            score = sum(1 for w in query_tokens if w in combined)
            if score > 0:
                page_qa_hits.append((score, q_clean, ans_clean, expl_clean))

        page_qa_hits.sort(key=lambda x: x[0], reverse=True)

        if page_qa_hits:
            top_hit = page_qa_hits[0]
            score, q_c, ans_c, expl_c = top_hit
            snippet = expl_c[:120] + ("..." if len(expl_c) > 120 else "")
            sources.append(SourceItem(page=page_num, title=title, snippet=snippet))

            entry = f"**From Page {page_num} ({title}):**\n"
            if expl_c:
                entry += f"- **Key Insight:** {expl_c}\n"
            if q_c:
                entry += f"- *Exam Context:* {q_c} *(Answer: {ans_c})*\n"
            page_insights.append(entry)
            continue

        # 2. General document sentence extraction
        sentences: List[str] = []
        for line in text.split("\n"):
            line_str = line.strip()
            if line_str and not is_header_or_footer_noise(line_str):
                for s in re.split(r"(?<=[.!?])\s+", line_str):
                    s_clean = " ".join(s.strip().split())
                    if len(s_clean) >= 25:
                        sentences.append(s_clean)

        page_sents = []
        for s_clean in sentences:
            if not is_valid_statement(s_clean):
                continue
            words = set([w.lower() for w in re.findall(r"\b\w{3,}\b", s_clean)])
            overlap = len(query_tokens.intersection(words))
            if overlap > 0:
                page_sents.append((overlap, s_clean))

        page_sents.sort(key=lambda x: x[0], reverse=True)
        if page_sents:
            top_sents = [s for _, s in page_sents[:2]]
            snippet = top_sents[0][:120] + ("..." if len(top_sents[0]) > 120 else "")
            sources.append(SourceItem(page=page_num, title=title, snippet=snippet))
            bullets = "\n".join([f"- {s}" for s in top_sents])
            page_insights.append(f"**From Page {page_num} ({title}):**\n{bullets}\n")

    if not page_insights:
        # Fallback to preview of first relevant page
        p = relevant_pages[0] if relevant_pages else {"page": 1, "title": "Overview", "text": ""}
        text_preview = p["text"][:350].strip()
        if text_preview:
            snippet = text_preview[:120] + ("..." if len(text_preview) > 120 else "")
            sources = [SourceItem(page=p["page"], title=p.get("title", f"Page {p['page']}"), snippet=snippet)]
            answer = (
                f"Based on **{document_name}**, here is the most relevant section regarding your question:\n\n"
                f"> \"{text_preview}...\"\n\n"
                f"You can review the full details on **Page {p['page']}**."
            )
            return answer, sources
        return "I couldn't find specific information about that in the document. Please try rephrasing your question.", []

    answer_parts = [f"Based on **{document_name}**, here are the key findings:\n"]
    answer_parts.extend(page_insights)
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
    content = clean_document_text(document.content_text or "")
    pages = parse_pages_from_content(content)

    if not pages:
        return "The document does not appear to contain readable text.", []

    relevant_pages = retrieve_relevant_pages(question, pages, top_k=3)

    # Check for external AI keys (ignoring placeholders)
    groq_key = settings.GROQ_API_KEY
    if groq_key and "your_groq_api_key" in groq_key:
        groq_key = None

    api_key = settings.GEMINI_API_KEY or settings.AI_API_KEY
    if api_key and "your_" in api_key:
        api_key = None

    openai_key = settings.OPENAI_API_KEY
    if openai_key and "your_" in openai_key:
        openai_key = None

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

    # Check for external AI keys (ignoring placeholders)
    groq_key = settings.GROQ_API_KEY
    if groq_key and "your_groq_api_key" in groq_key:
        groq_key = None

    api_key = settings.GEMINI_API_KEY or settings.AI_API_KEY
    if api_key and "your_" in api_key:
        api_key = None

    openai_key = settings.OPENAI_API_KEY
    if openai_key and "your_" in openai_key:
        openai_key = None

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
