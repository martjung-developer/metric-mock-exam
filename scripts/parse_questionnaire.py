#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
    from docx import Document
except Exception as exc:
    print(json.dumps({"error": f"Missing parser dependency: {exc}"}))
    sys.exit(1)


RED_COLOR = 0xFF0000
RE_QNUM = re.compile(r"^\s*(\d{1,3})[\.\)]\s+(.+)$")
RE_CHOICE = re.compile(r"^\s*[\(\[]?([a-dA-D])[\.\)\]]\s+(.+)$")
RE_SKIP = re.compile(
    r"^(bachelor|mock board|direction|name:|date:|score:|prepared by|subject reviewer)\b",
    re.I,
)
RE_AY = re.compile(r"AY \d{4}-\d{4}", re.I)


def clean_choice_prefix(text: str) -> str:
    text = re.sub(r"^[\(\[]?([a-dA-D])[\.\)\]]\s*", "", text.strip())
    return re.sub(r"\s+", " ", text).strip()


def should_skip(text: str) -> bool:
    t = text.strip()
    if len(t) < 5:
        return True
    if RE_SKIP.search(t) or RE_AY.search(t):
        return True
    if re.fullmatch(r"[\W_]+", t):
        return True
    return False


def build_row(number: int, stem: str, choices: list, passage: str = ""):
    labels = ["A", "B", "C", "D"]
    valid = True
    errors = []
    if not stem.strip():
        valid = False
        errors.append("No empty stems")
    if len(choices) < 2 or len(choices) > 5:
        valid = False
        errors.append("Each question must have 2-5 choices")
    correct = [c for c in choices if c.get("is_correct")]
    if len(correct) != 1:
        valid = False
        errors.append("Exactly 1 correct answer required")
    correct_label = correct[0]["label"] if len(correct) == 1 else ""

    by_label = {c["label"].upper(): c["text"] for c in choices}
    return {
        "_rowIndex": number + 1,
        "_valid": valid,
        "_errors": errors,
        "question_text": stem.strip(),
        "question_type": "multiple_choice",
        "correct_answer": correct_label,
        "option_a": by_label.get("A", ""),
        "option_b": by_label.get("B", ""),
        "option_c": by_label.get("C", ""),
        "option_d": by_label.get("D", ""),
        "explanation": "",
        "scenario": passage.strip(),
        "difficulty": "medium",
        "points": 1,
        "exam_id": "",
        "program_id": "",
    }


def split_inline_choices(line: str):
    matches = list(re.finditer(r"[\(\[]?([a-dA-D])[\.\)\]]\s+", line))
    if len(matches) <= 1:
        return [line]
    parts = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(line)
        seg = line[start:end].strip()
        if seg:
            parts.append(seg)
    return parts


def parse_docx(path: Path):
    doc = Document(str(path))
    paras = [p for p in doc.paragraphs if p.text and p.text.strip()]
    has_numbers = any(RE_QNUM.match(p.text.strip()) for p in paras[:30])
    return parse_docx_numbered(paras) if has_numbers else parse_docx_unnumbered(paras)


def para_is_bold(p) -> bool:
    return any((run.bold is True) and run.text.strip() for run in p.runs)


def parse_docx_numbered(paras):
    questions = []
    current = None
    pending_scenario = []

    for p in paras:
        text = re.sub(r"\s+", " ", p.text).strip()
        if should_skip(text):
            continue
        qm = RE_QNUM.match(text)
        if qm:
            if current:
                questions.append(current)
            stem = qm.group(2).strip()
            passage = "\n".join(pending_scenario).strip()
            pending_scenario = []
            current = {"stem": stem, "choices": [], "passage": passage}
            continue

        if current is None:
            if len(text) > 100 and not RE_CHOICE.match(text):
                pending_scenario.append(text)
            continue

        if len(text) > 100 and not RE_CHOICE.match(text) and not current["choices"]:
            current["passage"] = (current["passage"] + "\n" + text).strip()
            continue

        segments = []
        for tab_part in p.text.split("\t"):
            tab_part = re.sub(r"\s+", " ", tab_part).strip()
            if not tab_part:
                continue
            segments.extend(split_inline_choices(tab_part))

        if not segments:
            continue

        line_bold = para_is_bold(p)
        for seg in segments:
            m = RE_CHOICE.match(seg)
            if not m:
                continue
            label = m.group(1).upper()
            choice_text = clean_choice_prefix(seg)
            if not choice_text:
                continue
            is_correct = line_bold and (m.group(1).lower() in re.findall(r"[a-d]", seg.lower())[:1])
            current["choices"].append({"label": label, "text": choice_text, "is_correct": is_correct})

    if current:
        questions.append(current)

    rows = []
    for idx, q in enumerate(questions, start=1):
        # if multiple were tagged correct because same line bold, keep first
        correct_ix = [i for i, c in enumerate(q["choices"]) if c["is_correct"]]
        if len(correct_ix) > 1:
            for i in correct_ix[1:]:
                q["choices"][i]["is_correct"] = False
        rows.append(build_row(idx, q["stem"], q["choices"], q["passage"]))
    return rows


def parse_docx_unnumbered(paras):
    rows = []
    pending_passage = []
    i = 0
    qnum = 1
    while i < len(paras):
        text = re.sub(r"\s+", " ", paras[i].text).strip()
        if should_skip(text):
            i += 1
            continue

        if len(text) > 100 and not text.endswith("?") and not RE_CHOICE.match(text):
            pending_passage.append(text)
            i += 1
            continue

        if not text.endswith("?"):
            i += 1
            continue

        stem = text
        choices = []
        i += 1
        while i < len(paras):
            ct = re.sub(r"\s+", " ", paras[i].text).strip()
            if not ct:
                i += 1
                continue
            if ct.endswith("?"):
                break
            if len(ct) > 100 and choices:
                break
            if RE_SKIP.search(ct):
                i += 1
                continue
            if len(ct) <= 200 and not ct.endswith("?"):
                choices.append(
                    {
                        "label": chr(ord("A") + len(choices)),
                        "text": clean_choice_prefix(ct),
                        "is_correct": para_is_bold(paras[i]),
                    }
                )
            i += 1
            if len(choices) >= 5:
                break

        passage = "\n".join(pending_passage).strip()
        pending_passage = []
        rows.append(build_row(qnum, stem, choices, passage))
        qnum += 1
    return rows


def parse_pdf(path: Path):
    doc = fitz.open(str(path))
    lines = []
    for page in doc:
        blocks = page.get_text("dict", sort=True).get("blocks", [])
        for block in blocks:
            for line in block.get("lines", []):
                spans = line.get("spans", [])
                parts = []
                is_red = False
                for s in spans:
                    txt = s.get("text", "")
                    if txt:
                        parts.append(txt)
                    if int(s.get("color", 0)) == RED_COLOR:
                        is_red = True
                text = re.sub(r"\s+", " ", "".join(parts)).strip()
                if text:
                    lines.append({"text": text, "is_red": is_red})

    questions = []
    current = None
    pending_scenario = []

    for ln in lines:
        text = ln["text"]
        if should_skip(text):
            continue
        qm = RE_QNUM.match(text)
        if qm:
            if current:
                questions.append(current)
            current = {"stem": qm.group(2).strip(), "choices": [], "passage": "\n".join(pending_scenario).strip()}
            pending_scenario = []
            continue
        if current is None:
            if len(text) > 100 and not RE_CHOICE.match(text):
                pending_scenario.append(text)
            continue

        if len(text) > 100 and not RE_CHOICE.match(text) and not current["choices"]:
            current["passage"] = (current["passage"] + "\n" + text).strip()
            continue

        for seg in split_inline_choices(text):
            cm = RE_CHOICE.match(seg)
            if not cm:
                continue
            current["choices"].append(
                {
                    "label": cm.group(1).upper(),
                    "text": clean_choice_prefix(seg),
                    "is_correct": ln["is_red"],
                }
            )

    if current:
        questions.append(current)

    rows = []
    for idx, q in enumerate(questions, start=1):
        correct_ix = [i for i, c in enumerate(q["choices"]) if c["is_correct"]]
        if len(correct_ix) > 1:
            for i in correct_ix[1:]:
                q["choices"][i]["is_correct"] = False
        rows.append(build_row(idx, q["stem"], q["choices"], q["passage"]))
    return rows


def validate_batch(rows):
    issues = []
    if len(rows) != 100:
        issues.append(f"Exactly 100 questions expected; found {len(rows)}.")
    for i, row in enumerate(rows, start=1):
        if not row["_valid"]:
            issues.append(f"Row {i}: {'; '.join(row['_errors'])}")
    return issues


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: parse_questionnaire.py <file-path>"}))
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(json.dumps({"error": f"File not found: {path}"}))
        sys.exit(1)

    ext = path.suffix.lower()
    try:
        if ext in [".docx", ".doc"]:
            rows = parse_docx(path)
        elif ext == ".pdf":
            rows = parse_pdf(path)
        else:
            print(json.dumps({"error": f"Unsupported format: {ext}"}))
            sys.exit(1)

        issues = validate_batch(rows)
        print(json.dumps({"rows": rows, "issues": issues}))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()

