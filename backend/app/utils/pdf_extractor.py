import os
import re
from collections import Counter
from typing import Dict, List, Tuple
from pypdf import PdfReader


def normalize_line_signature(line: str) -> str:
    """Replaces numbers with # and trims whitespace to match template headers like 'Page 1'."""
    return re.sub(r"\d+", "#", line.strip())


def is_header_or_footer_noise(line: str) -> bool:
    """Checks if a single line matches universal header/footer/metadata noise patterns."""
    s = line.strip()
    if not s:
        return True
    # Standalone page numbers e.g. 'Page 1', '1 of 40', '- 12 -', '38'
    if re.match(r"^(?:page\s+)?-?\s*\d+\s*(?:of\s+\d+)?-?$", s, re.IGNORECASE):
        return True
    # Document header banners with pipe separators and metadata
    if re.search(r"\|.*(?:page\s+\d+|\d+\s*questions?|preparation|series|exam|confidential|copyright|edition)", s, re.IGNORECASE):
        return True
    # Repeated document titles with pipe separators
    if "|" in s and any(k in s.lower() for k in ["series", "questions made by", "preparation", "test series"]):
        return True
    # Standalone copyright / watermark notices
    if re.match(r"^(?:©|copyright|\(c\)|all rights reserved|confidential)", s, re.IGNORECASE):
        return True
    return False


COMMON_VERB_ROOTS = {
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "can", "could", "will", "would", "shall", "should",
    "may", "might", "must", "use", "uses", "used", "using", "provide", "provides",
    "provided", "providing", "enable", "enables", "enabled", "enabling",
    "allow", "allows", "allowed", "allowing", "ensure", "ensures", "ensured",
    "ensuring", "handle", "handles", "handled", "handling", "connect", "connects",
    "connected", "connecting", "operate", "operates", "operated", "operating",
    "perform", "performs", "performed", "performing", "transmit", "transmits",
    "transmitted", "transmitting", "examine", "examines", "examined", "examining",
    "store", "stores", "stored", "storing", "require", "requires", "required",
    "requiring", "include", "includes", "included", "including", "prevent",
    "prevents", "prevented", "preventing", "protect", "protects", "protected",
    "protecting", "define", "defines", "defined", "defining", "manage", "manages",
    "managed", "managing", "create", "creates", "created", "creating", "send",
    "sends", "sent", "sending", "receive", "receives", "received", "receiving",
    "implement", "implements", "implemented", "implementing", "support", "supports",
    "supported", "supporting", "serve", "serves", "served", "serving", "rely",
    "relies", "relied", "relying", "reduce", "reduces", "reduced", "reducing",
    "increase", "increases", "increased", "increasing", "control", "controls",
    "controlled", "controlling", "detect", "detects", "detected", "detecting",
    "encrypt", "encrypts", "encrypted", "encrypting", "decrypt", "decrypts",
    "forward", "forwards", "forwarded", "forwarding", "route", "routes", "routed",
    "routing", "map", "maps", "mapped", "mapping", "allocate", "allocates",
    "allocated", "allocating", "assign", "assigns", "assigned", "assigning",
    "scale", "scales", "scaled", "scaling", "block", "blocks", "blocked",
    "blocking", "demand", "demands", "demanded", "demanding", "synchronise",
    "synchronises", "synchronised", "synchronising", "synchronize", "synchronizes",
    "synchronized", "synchronizing", "authenticate", "authenticates",
    "authenticated", "authenticating", "segment", "segments", "segmented",
    "segmenting", "monitor", "monitors", "monitored", "monitoring", "filter",
    "filters", "filtered", "filtering", "verify", "verifies", "verified",
    "verifying", "validate", "validates", "validated", "validating",
    "establish", "establishes", "established", "establishing", "resolve",
    "resolves", "resolved", "resolving", "cover", "covers", "covered", "covering",
}


def is_valid_statement(s: str) -> bool:
    """Checks if a string is a complete, informative factual sentence rather than metadata or noise."""
    if len(s) < 30 or len(s) > 240:
        return False
    if s.startswith("http") or "@" in s:
        return False
    # Check for header/metadata patterns
    if re.search(r"\|.*(?:Page|Questions|Series|Preparation|Exam|Review|Bank|Author)", s, re.IGNORECASE):
        return False
    if re.search(r"\b(?:Page\s+\d+|SECTION\s+\d+|QB-\d+|Q\d+[\.:\)])\b", s, re.IGNORECASE):
        return False
    if re.match(r"^(?:Answer|Ans|Option|Explanation|Explain|Rationale|Note|Ref|Source)\s*:", s, re.IGNORECASE):
        return False
    if re.match(r"^[A-D]\)", s):
        return False
    # Reject table of contents rows or pure outlines
    if re.search(r"\bQ\d+[-–—]Q\d+\b", s):
        return False
    # Uppercase ratio check (avoid headings like ALL CAPS TITLE)
    letters = [c for c in s if c.isalpha()]
    if letters and sum(1 for c in letters if c.isupper()) / len(letters) > 0.35:
        return False
    words = s.split()
    if len(words) < 5:
        return False
    words_lower = set([w.lower().strip(".,;:!?\"'()") for w in words])
    if not words_lower.intersection(COMMON_VERB_ROOTS):
        return False
    return True


def clean_page_lines(
    lines: List[str],
    repeating_headers: set = None,
    repeating_footers: set = None,
) -> List[str]:
    """Cleans a list of lines for a single page, stripping repeating headers and footers."""
    if repeating_headers is None:
        repeating_headers = set()
    if repeating_footers is None:
        repeating_footers = set()

    cleaned: List[str] = []
    total_lines = len(lines)

    for idx, raw_line in enumerate(lines):
        line = raw_line.strip()
        if not line:
            continue

        sig = normalize_line_signature(line)

        # Check repeating headers in the first 6 lines of page
        if idx < 6 and (sig in repeating_headers or line in repeating_headers):
            continue

        # Check repeating footers in the last 4 lines of page
        if idx >= max(0, total_lines - 4) and (sig in repeating_footers or line in repeating_footers):
            continue

        # Check universal noise regex
        if is_header_or_footer_noise(line):
            continue

        cleaned.append(line)

    return cleaned


def clean_document_text(text: str) -> str:
    """
    Cleans an already extracted document string containing '--- Page X ---' markers,
    stripping recurring headers, footers, and noise.
    """
    if not text:
        return ""

    page_pattern = r"--- Page (\d+) ---\n"
    parts = re.split(page_pattern, text)
    if len(parts) <= 1:
        # Single page or unstructured text
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        cleaned = [l for l in lines if not is_header_or_footer_noise(l)]
        return "\n\n".join(cleaned)

    # Multi-page text
    page_items: List[Tuple[int, List[str]]] = []
    i = 1
    while i < len(parts) - 1:
        p_num = int(parts[i])
        p_text = parts[i + 1]
        lines = [l.strip() for l in p_text.split("\n") if l.strip()]
        page_items.append((p_num, lines))
        i += 2

    # Detect repeating headers across pages
    top_counter = Counter()
    bottom_counter = Counter()
    total_pages = len(page_items)
    threshold = max(2, int(total_pages * 0.25))

    for _, lines in page_items:
        for l in lines[:6]:
            top_counter[normalize_line_signature(l)] += 1
        for l in lines[-4:]:
            bottom_counter[normalize_line_signature(l)] += 1

    repeating_headers = {sig for sig, count in top_counter.items() if count >= threshold}
    repeating_footers = {sig for sig, count in bottom_counter.items() if count >= threshold}

    rebuilt_pages = []
    for p_num, lines in page_items:
        cleaned_lines = clean_page_lines(lines, repeating_headers, repeating_footers)
        rebuilt_pages.append(f"--- Page {p_num} ---\n" + "\n".join(cleaned_lines))

    return "\n\n".join(rebuilt_pages)


def extract_document_content(file_path: str) -> Tuple[str, int, List[Dict[str, any]]]:
    """
    Extracts text and page metadata from a PDF or text file with automated header,
    footer, and watermark deduplication.
    Returns:
        full_text: Cleaned text formatted with page markers
        page_count: Number of pages
        pages: List of dicts with page_number and text
    """
    ext = os.path.splitext(file_path)[1].lower()
    pages_data: List[Dict[str, any]] = []

    if ext == ".pdf":
        try:
            reader = PdfReader(file_path)
            page_count = len(reader.pages)
            raw_pages_lines: List[List[str]] = []

            for page in reader.pages:
                raw_text = page.extract_text() or ""
                lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
                raw_pages_lines.append(lines)

            # Detect repeating top headers and bottom footers across pages
            top_counter = Counter()
            bottom_counter = Counter()
            threshold = max(2, int(page_count * 0.25))

            for lines in raw_pages_lines:
                for l in lines[:6]:
                    top_counter[normalize_line_signature(l)] += 1
                for l in lines[-4:]:
                    bottom_counter[normalize_line_signature(l)] += 1

            repeating_headers = {sig for sig, count in top_counter.items() if count >= threshold}
            repeating_footers = {sig for sig, count in bottom_counter.items() if count >= threshold}

            full_text_parts = []
            for idx, lines in enumerate(raw_pages_lines, start=1):
                clean_lines = clean_page_lines(lines, repeating_headers, repeating_footers)
                clean_text = "\n".join(clean_lines).strip()
                pages_data.append({
                    "page_number": idx,
                    "text": clean_text,
                })
                full_text_parts.append(f"--- Page {idx} ---\n{clean_text}")

            full_text = "\n\n".join(full_text_parts)
            return full_text, max(page_count, 1), pages_data
        except Exception as e:
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
