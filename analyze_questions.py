#!/usr/bin/env python3
import json
import sys
import re

def analyze_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    issues = []
    seen_questions = {}

    for idx, q in enumerate(questions):
        # Check for missing question field
        if 'question' not in q or not q['question'] or not q['question'].strip():
            issues.append({
                "index": idx,
                "type": "missing_question",
                "description": "Missing or empty question field"
            })

        # Check for missing answer field
        if 'answer' not in q or not q['answer'] or not q['answer'].strip():
            issues.append({
                "index": idx,
                "type": "missing_answer",
                "description": "Missing or empty answer field"
            })

        # Check for too-short answers (less than 10 chars)
        answer = q.get('answer', '')
        if answer and len(answer.strip()) < 10:
            issues.append({
                "index": idx,
                "type": "too_short_answer",
                "description": f"Answer too short: {len(answer.strip())} chars"
            })

        # Check for unclosed backticks
        question_text = q.get('question', '')
        answer_text = q.get('answer', '')
        explanation_text = q.get('explanation', '')

        for field_name, text in [('question', question_text), ('answer', answer_text), ('explanation', explanation_text)]:
            backtick_count = text.count('`')
            if backtick_count % 2 != 0:
                issues.append({
                    "index": idx,
                    "type": "unclosed_backticks",
                    "description": f"Unclosed backticks in {field_name} field ({backtick_count} backticks)"
                })

            # Check for unclosed code blocks (``` without closing)
            code_blocks = re.findall(r'```', text)
            if len(code_blocks) % 2 != 0:
                issues.append({
                    "index": idx,
                    "type": "unclosed_code_block",
                    "description": f"Unclosed code block in {field_name}"
                })

        # Check for duplicate questions
        q_text = q.get('question', '').strip()
        if q_text:
            if q_text in seen_questions:
                issues.append({
                    "index": idx,
                    "type": "duplicate_question",
                    "description": f"Duplicate of question at index {seen_questions[q_text]}"
                })
            else:
                seen_questions[q_text] = idx

        # Check for invalid characters (control chars except newline/tab)
        for field_name in ['question', 'answer', 'explanation']:
            text = q.get(field_name, '')
            for i, char in enumerate(text):
                if char in '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x0b\x0c\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f' and char not in '\n\t':
                    issues.append({
                        "index": idx,
                        "type": "invalid_characters",
                        "description": f"Invalid control character in {field_name} at position {i}"
                    })
                    break

    return {
        "file": filepath.split('/')[-1],
        "questions_scanned": len(questions),
        "issues": issues
    }

if __name__ == '__main__':
    files = [
        '/home/runner/workspace/data/questions/math-logic.json',
        '/home/runner/workspace/data/questions/networking.json',
        '/home/runner/workspace/data/questions/nlp.json'
    ]

    results = []
    for f in files:
        results.append(analyze_file(f))

    print(json.dumps(results, indent=2))