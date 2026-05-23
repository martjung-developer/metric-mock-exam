#!/usr/bin/env python3
import importlib.util
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PARSER_PATH = ROOT / "parse_questionnaire.py"


def load_parser_module():
    spec = importlib.util.spec_from_file_location("parse_questionnaire", PARSER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load parser module at {PARSER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def resolve_existing_path(candidates):
    for c in candidates:
        p = Path(c)
        if p.exists():
            return p
    return None


def get_question_number(row, index1):
    raw = str(row.get("_rowIndex", "")).strip()
    if raw.isdigit():
        v = int(raw) - 1
        if v > 0:
            return v
    stem = str(row.get("question_text", "")).strip()
    m = re.match(r"^\s*(\d{1,3})[\.\)\-]\s+", stem)
    if m:
        return int(m.group(1))
    return index1


def summarize_rows(rows):
    total = len(rows)
    missing_correct = []
    seq = []
    for i, row in enumerate(rows, start=1):
        qn = get_question_number(row, i)
        seq.append(qn)
        ca = str(row.get("correct_answer", "")).strip().upper()
        options = [row.get("option_a", ""), row.get("option_b", ""), row.get("option_c", ""), row.get("option_d", "")]
        option_count = sum(1 for o in options if str(o).strip())
        if ca not in {"A", "B", "C", "D"}:
            missing_correct.append((qn, "no valid correct_answer label"))
        elif option_count >= 2:
            if not str(row.get(f"option_{ca.lower()}", "")).strip():
                missing_correct.append((qn, f"correct_answer={ca} points to empty option"))
    unique_sorted = sorted(set(seq))
    gaps = []
    if unique_sorted:
        for n in range(unique_sorted[0], unique_sorted[-1] + 1):
            if n not in set(unique_sorted):
                gaps.append(n)
    return total, missing_correct, gaps


def print_question_preview(row, idx):
    print(f"  Q{idx}: {row.get('question_text', '')}")
    print(f"    A) {row.get('option_a', '')}")
    print(f"    B) {row.get('option_b', '')}")
    print(f"    C) {row.get('option_c', '')}")
    print(f"    D) {row.get('option_d', '')}")
    print(f"    Correct: {row.get('correct_answer', '')}")


def main():
    parser = load_parser_module()

    file_targets = [
        [
            r"C:\Users\marti\Documents\BLIS QUESTIONNAIRES\INFOTECH MOCKBOARD EXAM.docx",
            r"C:\Users\marti\Documents\BLIS QUESTIONNAIRES\INFOTECH_MOCKBOARD_EXAM.docx",
        ],
        [
            r"C:\Users\marti\Documents\BLIS QUESTIONNAIRES\Library Organization and Management.docx",
            r"C:\Users\marti\Documents\BLIS QUESTIONNAIRES\Library_Organization_and_Management.docx",
        ],
        [
            r"C:\Users\marti\Documents\BLIS QUESTIONNAIRES\Selection and Acquisition.docx",
            r"C:\Users\marti\Documents\BLIS QUESTIONNAIRES\Selection_and_Acquisition.docx",
        ],
        [
            r"C:\Users\marti\Documents\BLIS QUESTIONNAIRES\Information-Sources-and-Services-Mock-Board-Examination-with Answer Key 2026.pdf",
            r"C:\Users\marti\Documents\BLIS QUESTIONNAIRES\Information-Sources-and-Services-Mock-Board-Examination.pdf",
        ],
    ]

    for candidate_list in file_targets:
        file_path = resolve_existing_path(candidate_list)
        print("=" * 120)
        if file_path is None:
            print(f"FILE: {candidate_list[0]}")
            print("Status: NOT FOUND")
            continue

        print(f"FILE: {file_path}")
        ext = file_path.suffix.lower()
        try:
            if ext in {".doc", ".docx"}:
                rows = parser.parse_docx(file_path)
            elif ext == ".pdf":
                rows = parser.parse_pdf(file_path)
            else:
                print(f"Status: Unsupported extension {ext}")
                continue
        except Exception as exc:
            print(f"Status: PARSE ERROR: {exc}")
            continue

        total, missing_correct, gaps = summarize_rows(rows)
        print(f"Total questions detected: {total}")

        if missing_correct:
            print(f"Questions with missing/invalid correct answer: {len(missing_correct)}")
            for qn, reason in missing_correct[:25]:
                print(f"  - Q{qn}: {reason}")
            if len(missing_correct) > 25:
                print(f"  ... and {len(missing_correct) - 25} more")
        else:
            print("Questions with missing/invalid correct answer: 0")

        if gaps:
            print(f"Question number gaps: {gaps}")
        else:
            print("Question number gaps: none")

        print("First 3 parsed questions:")
        preview = rows[:3]
        for i, row in enumerate(preview, start=1):
            print_question_preview(row, i)

        issues = parser.validate_batch(rows)
        print("Validation issues:")
        if issues:
            print(json.dumps(issues, indent=2))
        else:
            print("[]")


if __name__ == "__main__":
    main()
