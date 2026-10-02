import re
import json
import logging
import random
import httpx
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.models.document import Document
from app.models.quiz import Quiz, QuizQuestion
from app.schemas.quiz import (
    QuizResponse,
    QuizQuestionFrontend,
    SingleAnswerResponse,
    QuizResultResponse,
    QuestionReviewItem,
    QuizHistoryItem,
    AnswerItem,
    FlashcardItem,
    FlashcardsResponse,
)


from app.utils.pdf_extractor import (
    clean_document_text,
    COMMON_VERB_ROOTS,
    is_valid_statement,
)


def parse_qb_block(block: str) -> Optional[Dict[str, any]]:
    """Parses a structured Question Bank question block into standard MCQ format."""
    s = block.strip()
    m_head = re.match(r"^Q(?P<num>\d+)[\.:\)]\s*(?P<question>.+?)\n\s*A\)\s*(?P<rest>.*)", s, re.DOTALL)
    if not m_head:
        return None
    num = int(m_head.group("num"))
    question = " ".join(m_head.group("question").split())
    rest = m_head.group("rest")

    m_opt = re.search(
        r"^(?P<a>.+?)(?:\n\s*|\s{2,})B\)\s*(?P<b>.+?)(?:\n\s*|\s{2,})C\)\s*(?P<c>.+?)(?:\n\s*|\s{2,})D\)\s*(?P<d>.+?)\n\s*(?:Answer|Ans|Correct(?:\s+Answer)?)\s*:\s*(?P<ans>[A-D])\)?\s*(?P<ans_text>.*?)(?:\n\s*(?:Explanation|Explain|Rationale)\s*:\s*(?P<expl>.*))?$",
        rest,
        re.DOTALL | re.IGNORECASE,
    )
    if not m_opt:
        return None

    ans_letter = m_opt.group("ans").strip().upper()
    expl_text = " ".join(m_opt.group("expl").split()) if m_opt.group("expl") else f"The correct answer is ({ans_letter})."

    return {
        "order": num,
        "question": question,
        "option_a": " ".join(m_opt.group("a").split()),
        "option_b": " ".join(m_opt.group("b").split()),
        "option_c": " ".join(m_opt.group("c").split()),
        "option_d": " ".join(m_opt.group("d").split()),
        "correct_answer": ans_letter,
        "explanation": expl_text,
    }


def extract_qb_questions(content: str) -> List[Dict[str, any]]:
    """Extracts all structured multiple-choice questions if the document is a Question Bank or exam paper."""
    if not content:
        return []
    raw = re.sub(r"--- Page \d+ ---\n", "", content)
    blocks = re.split(r"\n(?=Q\d+[\.:\)])", raw)
    questions = []
    for b in blocks:
        q = parse_qb_block(b)
        if q:
            questions.append(q)
    return questions


def extract_key_statements(content_text: str) -> List[Dict[str, str]]:
    """Extracts clean informative sentences and facts from general document text."""
    if not content_text:
        return []

    # Clean text first
    cleaned = clean_document_text(content_text)
    cleaned = re.sub(r"--- Page \d+ ---\n", "", cleaned)
    paragraphs = [p.strip() for p in cleaned.split("\n\n") if len(p.strip()) > 30]

    statements = []
    for para in paragraphs:
        sentences = re.split(r"(?<=[.!?])\s+", para)
        for sent in sentences:
            s = " ".join(sent.strip().split())
            if is_valid_statement(s):
                statements.append({"text": s, "source": para[:100]})

    return statements


def generate_local_quiz_questions(
    statements: List[Dict[str, str]],
    document_name: str,
    count: int,
    difficulty: str,
) -> List[Dict[str, any]]:
    """
    Intelligently generates 4-option MCQs from document statements when offline,
    ensuring options and question stems are clean and meaningful.
    """
    if not statements:
        # Fallback if document text is sparse
        statements = [
            {"text": f"The document {document_name} contains information for study and analysis.", "source": "Intro"},
            {"text": "Key strategic goals must be measurable, actionable, and aligned with quarterly objectives.", "source": "Goals"},
            {"text": "Process automation helps reduce onboarding duration and manual overhead.", "source": "Process"},
            {"text": "Regular assessments and practice quizzes reinforce active recall and knowledge retention.", "source": "Review"},
            {"text": "Comprehensive documentation ensures consistency and clarity across all teams.", "source": "Documentation"},
        ]

    # Sample statements
    selected_statements = random.sample(statements, min(count, len(statements)))
    while len(selected_statements) < count:
        selected_statements.append(random.choice(statements))

    questions = []
    option_letters = ["A", "B", "C", "D"]

    distractor_templates = [
        "It is strictly deprecated in modern system architectures.",
        "It applies only to unauthenticated external public users.",
        "It eliminates the necessity of having any automated testing procedures.",
        "It relies entirely on manual weekly batch synchronization without caching.",
        "It decreases operational performance by over 80% under standard load.",
        "It is restricted exclusively to legacy offline single-user environments.",
        "It serves solely as an unencrypted fallback channel with no security controls.",
        "It bypasses authentication and provides unrestricted root access.",
    ]

    for idx, item in enumerate(selected_statements, start=1):
        target_text = item["text"]

        # Build varied question stems based on difficulty and content
        if difficulty == "easy":
            question_text = f"According to '{document_name}', which of the following statements is directly supported?"
        elif difficulty == "hard":
            question_text = f"In the context of '{document_name}', which critical assertion is highlighted?"
        else:
            if any(term in target_text.lower() for term in ["is defined as", "refers to", "means", "is a"]):
                question_text = f"According to '{document_name}', which concept or principle is accurately described?"
            elif any(term in target_text.lower() for term in ["provides", "ensures", "protects", "enables"]):
                question_text = f"Based on '{document_name}', what key role or function is explicitly affirmed?"
            else:
                question_text = f"Based on '{document_name}', which of the following assertions is correct?"

        correct_option = target_text

        # Create 3 plausible distractors from other document statements if available
        other_statements = [s["text"] for s in statements if s["text"] != target_text and len(s["text"]) > 20]
        if len(other_statements) >= 3:
            distractors = random.sample(other_statements, 3)
        else:
            distractors = random.sample(distractor_templates, 3)

        # Shuffle options
        all_options = [correct_option] + distractors
        random.shuffle(all_options)

        correct_idx = all_options.index(correct_option)
        correct_letter = option_letters[correct_idx]

        explanation = (
            f"According to '{document_name}':\n\"{target_text}\"\n\n"
            f"Therefore, option ({correct_letter}) is the correct choice."
        )

        questions.append({
            "order": idx,
            "question": question_text,
            "option_a": all_options[0],
            "option_b": all_options[1],
            "option_c": all_options[2],
            "option_d": all_options[3],
            "correct_answer": correct_letter,
            "explanation": explanation,
        })

    return questions


async def generate_groq_quiz_questions(
    content: str,
    document_name: str,
    count: int,
    difficulty: str,
    api_key: str,
    model: str = "openai/gpt-oss-120b",
) -> Optional[List[Dict[str, any]]]:
    """Generates MCQs using Groq Cloud API with JSON mode."""
    prompt = f"""You are an expert exam creator. Generate a {count}-question multiple-choice exam quiz based on the document '{document_name}'.
Difficulty level: {difficulty.upper()}.
Document text excerpts:
{content[:8000]}

Respond ONLY with a valid JSON object in this exact schema:
{{
  "questions": [
    {{
      "order": 1,
      "question": "Question text here",
      "option_a": "First choice",
      "option_b": "Second choice",
      "option_c": "Third choice",
      "option_d": "Fourth choice",
      "correct_answer": "A",
      "explanation": "Clear explanation citing the document"
    }}
  ]
}}"""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    max_tokens = min(3000, max(800, count * 350))
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an expert exam creator. You must output valid JSON."},
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.3,
        "max_tokens": max_tokens,
    }
    async with httpx.AsyncClient(timeout=45.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            try:
                text = data["choices"][0]["message"]["content"]
                cleaned_json = text.strip()
                if cleaned_json.startswith("```json"):
                    cleaned_json = cleaned_json[7:]
                if cleaned_json.endswith("```"):
                    cleaned_json = cleaned_json[:-3]
                parsed = json.loads(cleaned_json)
                if isinstance(parsed, dict) and "questions" in parsed and isinstance(parsed["questions"], list):
                    return parsed["questions"]
                elif isinstance(parsed, list):
                    return parsed
            except Exception as e:
                logger.warning(f"Failed to parse Groq quiz response: {e}")
        else:
            logger.warning(f"Groq quiz generation failed with status {resp.status_code}: {resp.text}")
    return None


async def generate_ai_quiz_questions(
    content: str,
    document_name: str,
    count: int,
    difficulty: str,
    api_key: str,
    provider: str = "gemini",
) -> Optional[List[Dict[str, any]]]:
    """Generates MCQs using Gemini or OpenAI structured JSON prompt."""
    prompt = f"""You are an expert exam creator. Generate a {count}-question multiple-choice exam quiz based on the document '{document_name}'.
Difficulty level: {difficulty.upper()}.
Document text excerpts:
{content[:8000]}

Format requirements:
Respond with ONLY a valid JSON array of objects with the following schema:
[
  {{
    "order": 1,
    "question": "Question text here",
    "option_a": "First choice",
    "option_b": "Second choice",
    "option_c": "Third choice",
    "option_d": "Fourth choice",
    "correct_answer": "A", // Must be one of "A", "B", "C", "D"
    "explanation": "Clear explanation citing the document"
  }}
]
Do not wrap in any extra markdown or codeblocks other than the json array."""

    if provider == "gemini":
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"},
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                try:
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    cleaned_json = text.strip()
                    if cleaned_json.startswith("```json"):
                        cleaned_json = cleaned_json[7:]
                    if cleaned_json.endswith("```"):
                        cleaned_json = cleaned_json[:-3]
                    parsed = json.loads(cleaned_json)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        return parsed
                except Exception:
                    pass

    return None


async def generate_quiz(
    db: AsyncSession,
    document: Document,
    user_id: str,
    question_count: int,
    difficulty: str,
) -> QuizResponse:
    """Creates a new quiz in the database and returns frontend-safe questions."""
    content = clean_document_text(document.content_text or "")
    questions_data = None

    # Priority 1: Check if the document contains structured questions (Question Bank / Exam)
    qb_questions = extract_qb_questions(content)
    if qb_questions and len(qb_questions) >= question_count:
        # Partition by difficulty if possible
        if difficulty == "easy":
            pool = qb_questions[: max(question_count, len(qb_questions) // 3)]
        elif difficulty == "hard":
            pool = qb_questions[max(0, len(qb_questions) * 2 // 3) :]
        else:
            pool = qb_questions

        if len(pool) < question_count:
            pool = qb_questions

        selected = random.sample(pool, min(question_count, len(pool)))
        questions_data = []
        for i, q in enumerate(selected, start=1):
            q_copy = dict(q)
            q_copy["order"] = i
            questions_data.append(q_copy)

    # Priority 2: Check for valid Groq API key
    if not questions_data:
        groq_key = settings.GROQ_API_KEY
        if groq_key and "your_groq_api_key" not in groq_key and len(content) > 100:
            try:
                questions_data = await generate_groq_quiz_questions(
                    content=content,
                    document_name=document.filename,
                    count=question_count,
                    difficulty=difficulty,
                    api_key=groq_key,
                    model=settings.GROQ_MODEL,
                )
            except Exception:
                questions_data = None

    # Priority 3: Check for Gemini API key
    if not questions_data:
        api_key = settings.GEMINI_API_KEY or settings.AI_API_KEY
        if api_key and "your_" not in api_key and len(content) > 100:
            try:
                questions_data = await generate_ai_quiz_questions(
                    content=content,
                    document_name=document.filename,
                    count=question_count,
                    difficulty=difficulty,
                    api_key=api_key,
                    provider="gemini",
                )
            except Exception:
                questions_data = None

    # Priority 4: Fallback to local intelligent quiz generator
    if not questions_data:
        statements = extract_key_statements(content)
        questions_data = generate_local_quiz_questions(
            statements=statements,
            document_name=document.filename,
            count=question_count,
            difficulty=difficulty,
        )

    # Save Quiz to DB
    quiz = Quiz(
        user_id=user_id,
        document_id=document.id,
        difficulty=difficulty,
        question_count=len(questions_data),
        score=0,
        is_completed=False,
    )
    db.add(quiz)
    await db.flush()
    await db.refresh(quiz)

    frontend_questions = []
    for q in questions_data:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            order=q.get("order", 0),
            question=q["question"],
            option_a=q["option_a"],
            option_b=q["option_b"],
            option_c=q["option_c"],
            option_d=q["option_d"],
            correct_answer=q["correct_answer"].upper(),
            explanation=q["explanation"],
        )
        db.add(qq)
        await db.flush()
        await db.refresh(qq)

        # Do NOT include correct_answer or explanation in the frontend response
        frontend_questions.append(
            QuizQuestionFrontend(
                id=qq.id,
                order=qq.order,
                question=qq.question,
                options=[qq.option_a, qq.option_b, qq.option_c, qq.option_d],
            )
        )

    return QuizResponse(
        quiz_id=quiz.id,
        document_id=document.id,
        document_name=document.filename,
        difficulty=quiz.difficulty,
        question_count=quiz.question_count,
        questions=frontend_questions,
    )


async def submit_single_answer(
    db: AsyncSession,
    quiz_id: str,
    user_id: str,
    question_id: str,
    user_answer: str,
) -> SingleAnswerResponse:
    """Validates a single question answer on the backend and reveals explanation."""
    # Verify quiz ownership
    quiz_res = await db.execute(select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == user_id))
    quiz = quiz_res.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")

    q_res = await db.execute(
        select(QuizQuestion).where(QuizQuestion.id == question_id, QuizQuestion.quiz_id == quiz_id)
    )
    qq = q_res.scalar_one_or_none()
    if not qq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    is_correct = (user_answer.upper() == qq.correct_answer.upper())
    qq.user_answer = user_answer.upper()
    qq.is_correct = is_correct
    await db.flush()

    return SingleAnswerResponse(
        question_id=qq.id,
        user_answer=qq.user_answer,
        correct_answer=qq.correct_answer,
        is_correct=is_correct,
        explanation=qq.explanation,
    )


async def submit_quiz(
    db: AsyncSession,
    quiz_id: str,
    user_id: str,
    answers: List[AnswerItem],
) -> QuizResultResponse:
    """Submits the complete quiz, calculates final score, and returns full question review."""
    quiz_res = await db.execute(select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == user_id))
    quiz = quiz_res.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")

    # Fetch document name
    doc_res = await db.execute(select(Document).where(Document.id == quiz.document_id))
    doc = doc_res.scalar_one_or_none()
    doc_name = doc.filename if doc else "Document"

    # Fetch all questions
    qq_res = await db.execute(
        select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.order)
    )
    questions = qq_res.scalars().all()

    # Map user answers
    answer_map = {a.question_id: a.user_answer.upper() for a in answers}

    correct_count = 0
    review_items = []

    for qq in questions:
        user_ans = answer_map.get(qq.id, qq.user_answer)
        if user_ans:
            qq.user_answer = user_ans
            qq.is_correct = (user_ans.upper() == qq.correct_answer.upper())
        else:
            qq.is_correct = False

        if qq.is_correct:
            correct_count += 1

        review_items.append(
            QuestionReviewItem(
                id=qq.id,
                order=qq.order,
                question=qq.question,
                options=[qq.option_a, qq.option_b, qq.option_c, qq.option_d],
                user_answer=qq.user_answer,
                correct_answer=qq.correct_answer,
                is_correct=bool(qq.is_correct),
                explanation=qq.explanation,
            )
        )

    quiz.score = correct_count
    quiz.is_completed = True
    await db.flush()

    total = len(questions)
    percentage = round((correct_count / total * 100.0), 1) if total > 0 else 0.0

    return QuizResultResponse(
        quiz_id=quiz.id,
        document_id=quiz.document_id,
        document_name=doc_name,
        difficulty=quiz.difficulty,
        score=correct_count,
        total=total,
        percentage=percentage,
        correct_count=correct_count,
        incorrect_count=total - correct_count,
        questions=review_items,
    )


async def get_quiz_history(db: AsyncSession, user_id: str) -> List[QuizHistoryItem]:
    """Retrieves all past quizzes completed by the user."""
    query = (
        select(Quiz, Document.filename)
        .join(Document, Quiz.document_id == Document.id)
        .where(Quiz.user_id == user_id)
        .order_by(Quiz.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    items = []
    for quiz, doc_name in rows:
        items.append(
            QuizHistoryItem(
                id=quiz.id,
                document_id=quiz.document_id,
                document_name=doc_name,
                difficulty=quiz.difficulty,
                question_count=quiz.question_count,
                score=quiz.score,
                is_completed=quiz.is_completed,
                created_at=quiz.created_at,
            )
        )
    return items


async def get_quiz_by_id(db: AsyncSession, quiz_id: str, user_id: str) -> QuizResultResponse:
    """Retrieves details of an existing quiz."""
    quiz_res = await db.execute(select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == user_id))
    quiz = quiz_res.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")

    doc_res = await db.execute(select(Document).where(Document.id == quiz.document_id))
    doc = doc_res.scalar_one_or_none()
    doc_name = doc.filename if doc else "Document"

    qq_res = await db.execute(
        select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.order)
    )
    questions = qq_res.scalars().all()

    total = len(questions)
    correct_count = sum(1 for q in questions if q.is_correct)
    percentage = round((correct_count / total * 100.0), 1) if total > 0 else 0.0

    review_items = [
        QuestionReviewItem(
            id=qq.id,
            order=qq.order,
            question=qq.question,
            options=[qq.option_a, qq.option_b, qq.option_c, qq.option_d],
            user_answer=qq.user_answer,
            correct_answer=qq.correct_answer,
            is_correct=bool(qq.is_correct),
            explanation=qq.explanation,
        )
        for qq in questions
    ]

    return QuizResultResponse(
        quiz_id=quiz.id,
        document_id=quiz.document_id,
        document_name=doc_name,
        difficulty=quiz.difficulty,
        score=correct_count,
        total=total,
        percentage=percentage,
        correct_count=correct_count,
        incorrect_count=total - correct_count,
        questions=review_items,
    )


def generate_flashcards(document: Document, count: int = 10) -> FlashcardsResponse:
    """Generates study flashcards with front (question/concept) and back (answer + explanation)."""
    content = clean_document_text(document.content_text or "")
    qb_questions = extract_qb_questions(content)

    cards = []
    if qb_questions:
        sample = random.sample(qb_questions, min(count, len(qb_questions)))
        for i, q in enumerate(sample, 1):
            ans_letter = q["correct_answer"]
            correct_text = q.get(f"option_{ans_letter.lower()}", "")
            back = f"**Option ({ans_letter}): {correct_text}**\n\n{q['explanation']}"
            cards.append(
                FlashcardItem(
                    id=str(i),
                    front=q["question"],
                    back=back,
                    hint=f"Correct choice is Option {ans_letter}",
                )
            )
    else:
        statements = extract_key_statements(content)
        sample = random.sample(statements, min(count, len(statements))) if statements else []
        for i, s in enumerate(sample, 1):
            text = s["text"]
            cards.append(
                FlashcardItem(
                    id=str(i),
                    front=f"Key Concept ({document.filename})",
                    back=text,
                    hint="Key finding from document",
                )
            )

    return FlashcardsResponse(
        document_id=document.id,
        document_name=document.filename,
        flashcards=cards,
    )
