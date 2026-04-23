---
name: mom-section-to-questions
description: Generate a batch of auto-graded MyOpenMath questions from a web page section, get the teacher's approval, write the .php files, then create each question in MyOpenMath and add it to a target assignment via playwriter. Use when turning textbook/section content into a graded MOM assignment end-to-end. Triggers include "generate MOM questions from this page", "turn this section into questions", "/mom-section-to-questions".
---

# MOM Section → Questions → Assignment

> End-to-end workflow. Point at a web page section, generate auto-graded MyOpenMath questions in batches of 5, approve or swap drafts, write the .php files, then push every question through MyOpenMath in a browser tab: create, verify Correct, and add to a target assignment. Auto-fixes common IMathAS syntax errors along the way.

## Prerequisites

- A logged-in MyOpenMath browser tab with the Playwriter Chrome extension connected on that tab
- The target course id (`cid`) and assignment id (`aid`) — or an assessment URL so they can be parsed
- A URL (or local file path) containing the section content the questions should cover
- The MOM question repo (where to write the .php files)

## When to Use

- Teacher has a textbook / course-notes section and wants an assignment built from it
- They want auto-graded questions (not FRQ essays)
- They want the whole loop: draft → approve → write → upload to MOM → verify → add to assignment

## When NOT to Use

- Single one-off question — use `mom-frq` or edit the repo directly
- Essay/FRQ questions — use `mom-frq` instead; this skill defaults to auto-graded
- Just verifying an existing question — use `mom-page-map` + `playwriter`

## Guardrails

> ⚠️ **Must NOT:**
> - Do not skip the approval gate. Always present all drafts and wait for explicit "approve" before writing files.
> - Do not proceed to the MOM loop without confirming the playwriter tab is connected and `aid` / `cid` are known.
> - Do not invent MOM macros; if a function is not in `reference/macros/` or not documented in `mom-frq`, do not use it.
> - Do not use `pow()`, `implode()`, `array_slice()`, `array_rand()`, `shuffle()`, `number_format()`. These are blocked PHP functions in IMathAS. See `references/autofix-patterns.md`.
> - Do not use variable-index array lookups (`$arr[$i]`) inside Question Text. Precompute a scalar in Common Control first.
> - Do not default to `multiple_choice`. Auto-graded = `number`, `calculated`, `ntuple` with `"set"` + `"anyorder"`, or `multipart` combining these.
> - Do not write files before the user approves the batch. Do not push to MOM before the user confirms the playwriter tab.

## Companion Skills

Chain these during the WRITE phase. They set conventions; this skill sets workflow.

| Companion | Role |
|-----------|------|
| `mom-style-guide` | Voice, rubric design, randomization strategy, house style |
| `mom-lib-map` | Route the topic to the right MOM library node |
| `mom-patterns` | Reuse verified question patterns from the cached knowledge base |
| `mom-frq` | IMathAS syntax, macros, allowed functions, question-type scaffolds |
| `mom-fact-finder` | If a pattern is missing from `mom-patterns`, harvest a fresh example |
| `mom-page-map` | Browser/URL patterns for the MOM loop |
| `playwriter` | Actual browser automation |

Load `mom-style-guide`, `mom-lib-map`, and `mom-patterns` before drafting. Load `mom-frq` before writing files.

## Invocation

This skill is designed for one-command start. Any of the following kicks off the pipeline:

- `/mom-section-to-questions` (no args) — start the pipeline, ask for all inputs in Phase 1.
- `/mom-section-to-questions start` — same as above. The word "start" is a no-op sentinel so the teacher has a consistent trigger phrase.
- `/mom-section-to-questions <url>` — start the pipeline with the URL pre-filled; skip that prompt in Phase 1 but still ask for the remaining inputs (N, cid/aid, topic folder).
- `/mom-section-to-questions <url> N=<number> aid=<id> cid=<id> topic=<slug>` — pre-fill whatever the teacher provides; ask for the rest.

**Entry rule:** on every invocation, jump directly to Phase 1 and use `AskUserQuestion` for any input the teacher did NOT pre-fill. Never silently assume a default for N, cid, aid, or topic.

If any argument is ambiguous (e.g. the URL looks wrong or the aid/cid don't exist on MOM), stop and re-ask via `AskUserQuestion` instead of proceeding.

## Workflow

### Phase 1: Gather Inputs

- **ASK the teacher** for:
  - Source URL or local file path (the section to read)
  - Total number of questions N (any positive integer)
  - Target course `cid` and assignment `aid` (accept an assessment URL and parse them)
  - Topic folder name under `questions/` (e.g. `sets`, `logic`, `combinatorics`) — infer from section title, confirm

- Do NOT start fetching until these are locked. Use `AskUserQuestion` if anything is missing.

### Phase 2: Fetch & Analyze Section

- Fetch the page with `WebFetch` (or `Read` for a local file).
- Identify the math topics, key definitions, worked examples, and the kinds of problems the section teaches.
- If the page is JS-heavy or behind a login, fall back to `playwriter` (`mcp__plugin_playwright_playwright__browser_navigate` or the `playwriter` CLI) to render and extract the section.

### Phase 3: Route the Library & Load Conventions

- Call `mom-lib-map` with the topic to pin the target MOM library node.
- Call `mom-style-guide` to reinforce voice, rubric, randomization, formatting rules.
- Call `mom-patterns` and scan `knowledge.md` for cached patterns that cover any of the planned topics.
- If a planned topic has no cached pattern and you need syntax beyond what's obvious, call `mom-fact-finder` to harvest one.

### Phase 4: Draft All N Questions

- Produce the full list of N drafts in one go (batched visually in groups of 5: **Questions 1–5**, **Questions 6–10**, etc.).
- For each draft, show:
  1. Short title
  2. Topic / concept being assessed
  3. Intended answer type (`number`, `ntuple`, `multipart`, ...)
  4. The exact correct answer (or the formula for it if randomized)
  5. One-line example of what the student sees

- Keep the drafts tight. This is a preview, not the final file.

### Phase 5: Approval Gate

- Show the full list (Phase 4) in one message. Ask:
  > Approve all? Or say "swap N: <new angle>" to regenerate a single slot.

- Use `AskUserQuestion` with options: `Approve all`, `Swap one or more`, `Start over`.
- If the user asks to swap slot N with a new angle, regenerate ONLY that slot and re-present the full list. Loop until approved.
- Do NOT proceed to Phase 6 without explicit approval.

### Phase 6: Write .php Files

- Choose the files directory: `questions/{topic}/` (create if missing).
- Name files `q{N}-{kebab-slug}.php`, where `N` is 1..total and slug comes from the approved title.
- Each file follows the house template — see `references/file-template.md`.
- **Randomize by default.** Every question that CAN be randomized MUST be. Use `jointrandfrom(...)` with 3+ parallel arrays (inputs + precomputed answer) for set-scenario questions. Use `rand(min, max)` + derived computation for numerical scenarios (Venn counts, regression data, etc.). Only questions whose pedagogical point depends on specific constants (e.g., a "classic" example) may stay fixed — explicitly note this in the file's top comment when you do.
- When the answer is itself a function of random inputs, precompute it in Common Control so auto-grading stays exact. Do not rely on student expressions matching one specific form.
- Reuse patterns from `mom-patterns` / `mom-frq` for answer-type scaffolds. Apply autofix rules proactively (`references/autofix-patterns.md`).
- After writing, confirm the file count and list paths.

### Phase 7: Playwriter Gate

- Before the MOM loop, **pause** and ask:
  > Is the Playwriter extension connected to a MyOpenMath tab? Paste the assignment URL (or confirm `aid={...}`, `cid={...}`).
- Use `AskUserQuestion`. Offer a `Connected — proceed` option and an `I need to set it up` option.
- If not connected, walk them through: open the MOM tab, click the Playwriter extension icon, return and confirm.
- Once confirmed, run `playwriter session new` (or reuse the existing session) and verify `context.pages()` returns the MOM tab.

### Phase 8: MOM Create → Verify → Add Loop

For each file in order, run the loop below. Full code snippets live in `references/mom-verify-loop.md`. The loop uses the exact pattern validated against MOM on 2026-04-19.

1. **Create**: navigate to `moddataset.php?cid={cid}`, set description, pick the multipart type via the question-type picker, fill Common Control / Question Text / Detailed Solution via the CodeMirror API (`cm.setValue(...)` then `cm.save()`), click Save. Extract `qid` from the post-save URL.
2. **Verify**: open `testquestion2.php?cid={cid}&qsetid={qid}`. Compute the expected correct answer (for randomized questions, parse the rendered question text). Submit. Read `.scoremarker` text.
3. **Auto-fix on Incorrect**: diagnose common issues (see `references/autofix-patterns.md`). Patch the .php file, re-save via the edit page (reuse the same qid — do not create a duplicate), then re-verify. Allow up to 2 auto-fix attempts before asking.
4. **Add to assignment**: navigate to `addquestions2.php?aid={aid}&cid={cid}`, search by description (works across all scopes; searching by numeric qid only works when scope is "Unassigned" which is fragile), check the row checkbox, click the top-level `Add` button via `page.evaluate()` — the button has no stable selector but matches exact text `Add`.
5. **Verify add**: re-read the "Questions in Assessment" table, confirm the qid is present.

Continue until all N questions are processed. Keep a running log of `{slot, qid, verify_status, autofixes_applied}`.

### Phase 9: Update Repo Docs

After the MOM loop succeeds, update the repo's reference docs so the new topic is discoverable. **The repo uses a thin-pointer pattern: the root `AGENTS.md` stays small, each topic gets its own nested `questions/{topic}/AGENTS.md` with the full detail.** Do not bloat the root with per-family pattern bullets.

**Primary action — always: write / update `questions/{topic}/AGENTS.md`.**

Mirror the structure of `questions/sets/AGENTS.md` or `questions/trig/AGENTS.md`:

```markdown
# {Topic} Questions — {one-line scope}

**Parent:** `../../AGENTS.md`
**Files:** {N} autograded {topic} questions covering {sub-areas}

## OVERVIEW
{2-3 sentences about what this family tests and how it's auto-graded.}

## QUESTION TYPES
| File | Parts | Answer Types | Description |
|------|-------|--------------|-------------|
| `qN-slug.php` | M | ntuple / number / ... | One-line description with the randomization angle |

## CONVENTIONS
{5-8 bullets covering answer-type scaffolds, randomization strategy, any topic-specific gotchas found during autofix (braces, blocked macros, empty-result handling, etc.).}

## ADDING A NEW {TOPIC} QUESTION
{3-5 bullet recipe specific to this family.}

## GOTCHAS
{Topic-specific pitfalls surfaced during verify/autofix.}
```

This is the **only** place pattern detail belongs. All the Phase-8 autofix lessons that are topic-specific go here.

**Secondary action — root `AGENTS.md` update: pointer-only, 3 surgical edits.**

1. `OVERVIEW` paragraph: if this is a new family, bump the family count ("Eight" → "Nine") and add a short descriptor to the list.
2. `STRUCTURE` tree: insert one `questions/{topic}/` line between the alphabetically-adjacent families with a one-line summary + count.
3. `CONVENTIONS — PER-FAMILY POINTERS` table: add one row pointing to `questions/{topic}/AGENTS.md`.

**Do NOT** add a per-family CONVENTIONS subsection to the root, add a family-specific ADDING NEW QUESTIONS subsection to the root, or copy the pattern detail into the root. All of that belongs in the nested doc. The goal is that a reader of the root `AGENTS.md` sees _what exists_, not _how to write each kind_ — they drill into `questions/{topic}/AGENTS.md` only when they need the detail.

### Phase 10: Summary

- Table of all questions: slot, title, qid, repo file, verify result, any auto-fixes.
- List leftover artifacts to clean up (e.g., test questions from debugging, if any).
- List the docs files updated (`AGENTS.md`, and any topic-level one created).
- Remind the teacher to open the assignment in MOM and preview.

## Auto-fix Policy

- **Attempt auto-fix first** for known error classes (see `references/autofix-patterns.md`).
- Limit to 2 auto-fix attempts per question.
- After 2 failed attempts, stop and ask the teacher which direction to take.
- Always log what was auto-fixed so the teacher can review.

## Timeout Handling (Playwriter specifics)

Playwriter `-e` calls frequently time out at 10s while the underlying browser action succeeds. Default pattern:

1. Issue the action (navigate / click / save).
2. If the command times out, re-query state (URL, element text, assignment table) in a small follow-up call.
3. Only retry the action if the state confirms the action didn't happen.

See `references/mom-verify-loop.md` for the exact retry loop.

## Error Handling

| Problem | Action |
|---------|--------|
| Section URL is 404 or empty | Stop; ask teacher for a working URL or paste the content. |
| Playwriter extension not connected | Pause in Phase 7 and walk through the connection steps. |
| `mom-patterns/knowledge.md` has no entry for a planned topic | Invoke `mom-fact-finder` to harvest one; append to knowledge.md. |
| Rendered question shows `{  }` with empty interpolation | Common Control error. Check preview for "Error in question:" text. Apply autofix from `references/autofix-patterns.md`. |
| `Error in question: unallowed macro X` | Replace X with the IMathAS equivalent from `references/autofix-patterns.md`. |
| `Incorrect` on verify but no error in preview | Double-check the expected answer computation. For `ntuple` sets, confirm `$displayformat[0] = "set"` AND `$answerformat[0] = "anyorder"` are BOTH set. |
| Add-to-assignment search returns no rows | Default scope is "In Libraries" — search by description works; by qid does not unless scope is switched. |
| Save on `moddataset.php` redirects to `manageqset.php` with empty fields | CodeMirror wasn't synced. Ensure `cm.save()` is called AFTER `cm.setValue(...)` and BEFORE clicking Save. |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping the approval gate and writing files immediately | Always run Phase 5. |
| Using `$anstypes = array("multiple_choice")` by default | Default to `number` / `ntuple` / `multipart`. |
| Hardcoding values that could be randomized | Every scenario-based question should have 3+ parallel rows via `jointrandfrom`; every numeric scenario should use `rand(min, max)` + derived compute. |
| Rendering `{$var}` as set braces in Question Text | Add a space: `{ $var }` — `{$var}` is PHP variable-interpolation and strips the braces. |
| Filling a hidden `#control` textarea with Playwright `fill()` | Use the CodeMirror instance (`.CodeMirror` sibling element). |
| Searching by qid on `addquestions2.php` | Search by the question description instead. |
| Treating the 10s playwriter timeout as a failure | Re-query state before retrying. |
| Running the MOM loop before confirming the playwriter tab | Phase 7 is mandatory. |

## References
- `references/autofix-patterns.md` — IMathAS macro substitutions, common CC errors and their fixes
- `references/file-template.md` — The .php file template this skill writes
- `references/mom-verify-loop.md` — Exact playwriter snippets for the create → verify → add loop
