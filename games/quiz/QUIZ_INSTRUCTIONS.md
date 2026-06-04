# Super Minds Quiz — Creation Instructions

This document explains how the **Super Minds 2nd Edition** grammar quizzes are built and how new ones should be created.

---

## 1. What we have

| File | Purpose |
|---|---|
| `quiz.html` | Generic template. Loads a quiz from a TXT file (or embedded sample for SM5_U9). |
| `quiz-121.html` | Variant for SM4_U4 ("Lunchtime") — same engine, different embedded sample. |
| `SMx_Uy.txt` (planned) | One file per unit. Loaded by either HTML file. |
| `QUIZ_INSTRUCTIONS.md` | This file. |

The HTML engine is **tap-only** (no typing) and is designed for **landscape tablets** in the classroom. It does not need a server — just open in a browser.

---

## 2. Folder layout

```
BAJKI/
├── 121.jpg, 122.jpg, … 126.jpg   ← source book scans (input)
├── quiz.html                      ← template engine
├── quiz-121.html                  ← sample for Unit 4
├── SM_summaries/                  ← (planned) output TXT files
│   ├── SM1_U0.txt … SM1_U9.txt
│   ├── SM2_U0.txt … SM2_U9.txt
│   └── … SM6_U0.txt … SM6_U9.txt
└── QUIZ_INSTRUCTIONS.md           ← this file
```

---

## 3. How a quiz is loaded

There are **two ways** to start a quiz from any HTML file:

1. **Tap the sample button** on the start screen → loads the embedded quiz.
2. **Drag-and-drop** (or tap to choose) any `SMx_Uy.txt` file from the file system.

---

## 4. TXT file format

A quiz is a plain UTF-8 text file using HTML-style tags. Top-level structure:

```xml
<quiz>
  <id>SM4_U4</id>
  <name>Unit 4: Lunchtime</name>
  <description>Optional one-line summary of the unit.</description>

  <grammar-block number="1">
    <title>Affirmative & Negative</title>
    <description>One-line grammar explanation.</description>
    <questions>
      <question id="1" type="mc" topic="...">
        <prompt>...</prompt>
        <options><option>...</option> ...</options>
        <correct>...</correct>
        <tip>...</tip>
      </question>
      ...
    </questions>
  </grammar-block>

  <grammar-block number="2">
    <title>Questions</title>
    <description>...</description>
    <questions>...</questions>
  </grammar-block>
</quiz>
```

### Rules

- Two `<grammar-block>` elements per unit (Block 1 = statements, Block 2 = questions is the typical pattern, but content may vary).
- Question `id` is a simple integer string and must be unique within the file.
- 8–12 questions per file is the target. Each block has roughly half.

---

## 5. Supported question types

Only **three** types render correctly in tap mode. Any other type is silently dropped on load.

| Type | When to use | Required tags |
|---|---|---|
| `mc` | Multiple choice (4 options typical) | `<prompt>`, `<options>`, `<correct>`, `<tip>` |
| `fill` | Single-gap fill in the blank | `<prompt>` (must contain `___`), `<options>`, `<answer>`, `<tip>` |
| `rearrange` | Tap word chips to build a sentence | `<prompt>`, `<answer>` (the target sentence), `<tip>` |

> **No typing allowed.** Anything requiring free text input (long answers, dialogues, error correction in open form) must be **rewritten as MCQ** with `<options>` and `<correct>`.

### Examples of "MCQ-ifying" a typed exercise

A textbook dialogue:
> A: Have you called your brother yet?  B: ?

Becomes:
```xml
<question type="mc" topic="dialogue-answer">
  <prompt>A: Have you called your brother yet?
B: (say "yes" with "already") — Tap B's reply.</prompt>
  <options>
    <option>Yes, I've already called him.</option>
    <option>Yes, I've yet called him.</option>
    <option>Yes, I have called him yet.</option>
    <option>Yes, I already called.</option>
  </options>
  <correct>Yes, I've already called him.</correct>
  <tip>Add "already" after the auxiliary in the short answer.</tip>
</question>
```

An error-correction exercise:
> Correct the mistake: "I have finished already my lunch."

Becomes:
```xml
<question type="mc" topic="error-correction">
  <prompt>One of these sentences is WRONG. Tap the CORRECT version of:
"I have finished already my lunch."</prompt>
  <options>
    <option>I have already finished my lunch.</option>
    <option>I have finished already my lunch.</option>
    <option>I already have finished my lunch.</option>
    <option>I have finish already my lunch.</option>
  </options>
  <correct>I have already finished my lunch.</correct>
  <tip>"Already" goes between "have" and the past participle.</tip>
</question>
```

A transform exercise:
> What's the negative of: "They've already arrived."

Becomes:
```xml
<question type="mc" topic="transform-negative">
  <prompt>What is the correct NEGATIVE form of:
"They've already arrived."?</prompt>
  <options>
    <option>They haven't arrived yet.</option>
    <option>They haven't already arrived.</option>
    <option>They didn't arrive yet.</option>
    <option>They don't arrived already.</option>
  </options>
  <correct>They haven't arrived yet.</correct>
  <tip>When negating, swap "already" for "yet" at the end.</tip>
</question>
```

---

## 6. The fill rule (very important)

For a `<fill>` question, the **prompt must contain the full sentence** with `___` exactly where the gap is. Labels like "Complete the sentence:" alone are not enough — the student must see what they're filling in.

✅ Correct:
```xml
<prompt>I have ___ finished my lunch.</prompt>
<options><option>already</option><option>yet</option></options>
<answer>already</answer>
```

❌ Wrong:
```xml
<prompt>Complete the sentence:</prompt>  ← nothing to complete!
<options>...</options>
<answer>have</answer>
```

The HTML engine replaces the first `___` in the prompt with a tappable blank.

---

## 7. The negative icon

A red **− Negative** badge automatically appears on a question when:

- the `topic` contains the word "negative" or "no" (e.g. `topic="negative-form"`, `topic="short-answer-no"`), **or**
- the `<answer>` or `<correct>` starts with a negative word (`don't`, `doesn't`, `didn't`, `isn't`, `aren't`, `wasn't`, `haven't`, `hasn't`, or `No,`).

No extra tag is needed. Just pick a topic name that describes the exercise (`topic="have-negative-plural"`, `topic="transform-negative"`, etc.) and the badge appears.

This helps younger students recall the negative form at a glance.

---

## 8. Topic naming convention

Use short, hyphen-separated, lowercase tags. Suggested patterns:

| Pattern | Use for |
|---|---|
| `topic="have-vs-has"` | MCQ contrasting two forms |
| `topic="have-affirmative"` | Affirmative fill or MCQ |
| `topic="have-negative-plural"` | Negative fill or MCQ |
| `topic="error-correction"` | MCQ "which is correct?" |
| `topic="transform-negative"` | MCQ "make this negative" |
| `topic="transform-question"` | MCQ "make this a question" |
| `topic="short-answer-yes"` | "Yes, I do."-style answer |
| `topic="short-answer-no"` | "No, I don't."-style answer |
| `topic="build-question"` | MCQ "which is the correct question?" |
| `topic="dialogue-answer"` | MCQ "which is the correct reply?" |
| `topic="position-of-already"` | MCQ about word order |
| `topic="any"` | fill with "any" / "some" |
| `topic="yet-in-question"` | fill with "yet" at end of question |

---

## 9. Workflow for generating a new level

1. User provides the **last 10 image files** of a level's folder (e.g. `130.jpg` … `139.jpg`).
2. I read each image and identify the unit (Unit 0 to Unit 9) and the grammar.
3. I extract: book, unit number, unit title, both grammar blocks with their descriptions, and any textbook exercises.
4. I write one `SM{level}_U{unit}.txt` per unit containing:
   - the structural metadata (`<id>`, `<name>`, `<description>`)
   - the two grammar blocks
   - the textbook exercises **converted to tap-only form** (typed → MCQ)
   - **additional practice exercises** I generate to round out to ~10 questions
5. Files are saved to `C:\Users\gnatho\Documents\BAJKI\SM_summaries\`.
6. The user reviews the first unit, then the rest of the level, before moving to the next level.

**Order of processing:** Level 5 first (since `126.jpg` was the example) → Level 4 → Level 1 → Level 2 → Level 3 → Level 6.

---

## 10. Checklist for a new TXT file

Before saving, verify each file:

- [ ] Root tag is `<quiz>`, file ends with `</quiz>`
- [ ] Has `<id>`, `<name>`, `<description>`
- [ ] Has exactly **two** `<grammar-block>` elements with `number="1"` and `number="2"`
- [ ] Each block has a `<title>`, `<description>`, and a `<questions>` wrapper
- [ ] Every question has a unique `id` and a `type` in `{mc, fill, rearrange}`
- [ ] MCQ: has `<options>` (2–4 items) and `<correct>` matching one option
- [ ] Fill: `<prompt>` contains the full sentence **with** `___`, has `<options>`, has `<answer>` matching one option
- [ ] Rearrange: `<answer>` is the complete target sentence
- [ ] No `<freer-practice>`, no `<textarea>`-requiring types
- [ ] Tips are short, kid-friendly, and explain the rule being tested
- [ ] 8–12 questions total, ~5–6 per block

---

## 11. Engine features (for reference)

The HTML engine provides:

- Tap-only input (no keyboard, no textarea)
- Big touch targets (min 60–70px), landscape-optimized layout
- 2- or 3-column option grids on wide screens
- Per-question feedback with "Correct/Not quite" + expected answer + tip
- Progress bar + per-question score
- End-of-quiz score percentage + per-question breakdown
- Word-chip interaction for `rearrange`
- Inline blank-fill interaction for `fill`
- Auto negative badge (Section 7)
- Auto-skip of unsupported question types on load

---

## 12. Quick-reference: minimum viable MCQ

If in doubt, use this template for any exercise:

```xml
<question id="N" type="mc" topic="some-descriptive-topic">
  <prompt>The clear question text shown to the student.</prompt>
  <options>
    <option>Correct answer</option>
    <option>Wrong distractor 1</option>
    <option>Wrong distractor 2</option>
    <option>Wrong distractor 3</option>
  </options>
  <correct>Correct answer</correct>
  <tip>One short sentence explaining the rule.</tip>
</question>
```

This always works. When in doubt, MCQ is the safest choice.
