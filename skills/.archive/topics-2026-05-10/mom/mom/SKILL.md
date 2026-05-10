---
name: mom
description: "MyOpenMath (MOM) tools for educators — build practice tests and grade partial-credit work. Use for: 'build a practice test', 'grade show-your-work', 'practice assessment from chapter', 'ungraded practice MOM', 'partial credit review'. Covers assessment assembly from existing repo questions, gap-filling with new drafts, and scoring student work images with bonus-only adjustments."
tags: [myopenmath, education, grading, assessment, practice-test]
---

# MyOpenMath (MOM) Educator Tools

Two core workflows for MOM educators: building practice assessments and grading partial-credit work.

## 1. Practice Test Builder (from mom-practice-test)

Assembles a practice (ungraded/low-stakes) MOM assessment from existing repo questions first, drafts new ones only if gaps exist. Starts from a chapter/topic, SELECTS existing .php files, only drafts when coverage gaps remain, then creates the assessment with practice-specific settings.

### Prerequisites
- MOM question repo at workspace path with `questions/` directories and `AGENTS.md` files
- Logged-in MyOpenMath browser tab with Playwriter Chrome extension connected
- Target course `cid` and block path
- Chapter/topic identifier (e.g. 'Ch8 Regression')

### Practice Test Settings

| Field | Value |
|-------|-------|
| Name | `Practice: {topic}` |
| Display method | All-on-one-page or One-at-a-time |
| Subtype | `Homework` |
| Default attempts | `999` (unlimited) or `3` |
| GB category | `Practice` or `Not for grade` |
| Show solutions | Yes (after last attempt) |
| Points | Low or 0 |

### Workflow Phases
1. **Gather Inputs** — chapter/topic, cid, block path, N questions, preferences
2. **Scan Repo** — search questions/ for matching .php files, build coverage matrix
3. **Select Existing** — pick from repo, flag gaps
4. **Draft New (if gaps)** — use mom-section-to-questions workflow, approval gate required
5. **Create Assessment** — navigate to addassessment2.php, set practice settings
6. **Add Questions** — create→verify→add loop per question
7. **Configure** — verify all practice-specific settings
8. **Update Docs** — update AGENTS.md if new .php files written
9. **Summary** — table of all questions with assessment URL

**Key principle:** SELECT existing repo questions first, draft only for gaps. Never set graded category on practice tests.

---

## 2. Grade Show-Your-Work (from grade-show-work)

Evaluate partial credit for "show your work" math problems on MOM grading pages, especially when students uploaded work images and auto-scores are below passing.

### Workflow
1. Review the auto-score and the student's uploaded work image
2. Assess work quality: correct approach, computational errors, vs conceptual errors
3. Apply bonus-only adjustments (never reduce auto-score)
4. Write a brief report before any score changes
5. Only change scores after explicit teacher approval

### Grading Guidelines

| Work Quality | Bonus |
|---------------|-------|
| Correct approach, minor computation error | +10-20% |
| Correct approach, significant computation error | +5-15% |
| Partial approach, some correct steps | +0-10% |
| No work shown or completely wrong approach | +0% |

**Key principle:** Report-first, bonus-only. Never reduce auto-scores. Never change scores without explicit approval.