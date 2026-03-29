---
name: mom-frq
description: Use when writing MyOpenMath free response (essay) questions, creating MOM question code, or authoring IMathAS essay-type assessment items from a topic description
---

# MyOpenMath Free Response Question Author

## Overview

Write production-ready MyOpenMath free response (essay) questions from a topic/description. MyOpenMath uses a **custom pseudo-PHP language** (NOT standard PHP) running on the IMathAS platform.

**Critical:** MyOpenMath code has NO `<?php ?>` tags, NO `echo`, NO `print`. Variables are assigned directly. Output is handled by the question text section automatically.

## When to Use

- User asks to write a MyOpenMath free response / essay question
- User provides a topic and wants MOM question code
- User wants to create an IMathAS essay assessment item

## Manifest: `C:/Users/shuff/mom/questions/manifest.json`

The manifest tracks which questions are completed and which are pending. Structure:

```json
{
  "source": "ch6-questions.txt",
  "questions": {
    "1": { "status": "completed", "file": "q1-single-proportion-hypothesis-test.php", "title": "...", "prompt": "..." },
    "3": { "status": "pending", "file": null, "title": "...", "prompt": "..." }
  }
}
```

**Rules:**
- **Read the manifest before doing anything** in both single and batch mode.
- **Never overwrite completed questions.** If `status` is `"completed"`, skip it entirely.
- **After writing a question file**, update the manifest: set `status` to `"completed"` and `file` to the filename (just the filename, not the full path).
- When the user says "all" or gives a range, filter to only `"pending"` entries.
- **Output folder:** Derive the subfolder from the manifest's `source` field — strip the `.txt` extension to get the folder name (e.g., `ch6-questions.txt` → `ch6-questions`, `butte-stats-week1-5-questions.txt` → `butte-stats-week1-5-questions`). All question files for this manifest go into `C:/Users/shuff/mom/questions/frq/<source-folder>/`. Create the folder if it doesn't exist.
## Batch Mode (skip rubric review)

When the user provides **multiple questions** and indicates they want to skip rubric review (e.g., "batch", "all", "skip review", "no review", or passes a range like "questions 3-8"), use this workflow:

1. **Read the manifest** (`C:/Users/shuff/mom/questions/manifest.json`) to identify which questions are pending.
2. **Check system resources** to determine max parallel agents. Run:
   ```bash
   nproc && cat /proc/meminfo | head -2
   ```
   Then calculate: `max_parallel = min(cores / 8, available_ram_gb / 4, 4)`, floored at 2, capped at 4. If the check fails, default to 3. If there are more pending questions than `max_parallel`, process them in waves of `max_parallel` at a time (launch wave 1, wait for all to finish and update manifest, then launch wave 2, etc.).
3. **Read one existing completed question file** to use as a reference for sub-agents.
4. **Spawn agents up to `max_parallel` at a time** using the Task tool with `subagent_type: "general-purpose"`. Each sub-agent gets:
   - The full SKILL.md content (this file) as context for the template pattern and all rules
   - The specific question title and prompt from the manifest
   - The contents of the reference question file
   - Instructions to design the rubric AND generate the code in one shot (no user review)
   - The output file path: `C:/Users/shuff/mom/questions/frq/<source-folder>/q<number>-<kebab-case-topic>.php` where `<source-folder>` is the manifest's `source` field with `.txt` stripped (e.g., `ch6-questions`). So a full example path: `C:/Users/shuff/mom/questions/frq/ch6-questions/q3-chi-square-goodness-of-fit.php`. Create the folder if it doesn't exist.
5. **After each agent finishes**, update the manifest entry: set `status` to `"completed"` and `file` to the filename written.
6. **If more pending questions remain**, launch the next wave (back to step 4).
7. **After all waves finish**, report a summary table:

```
| # | Question | File | Status |
|---|----------|------|--------|
| 3 | Chi-Square Goodness of Fit | q3-chi-square-goodness-of-fit.php | Done |
| 4 | Chi-Square Independence | q4-chi-square-independence.php | Done |
| 1 | Single Proportion Inference | q1-single-proportion-hypothesis-test.php | Skipped (already completed) |
```

**Sub-agent prompt must include:**
- The entire Required Template Pattern, all syntax rules, rubric design rules, and common mistakes from this skill
- A reference question file (read its contents and include them)
- The instruction: "Design the rubric internally (2-4 categories, 10 points total, neutral student items, specific ideal targets) and generate the complete MOM code. Write the file directly. No user interaction needed."
- All style rules: write like a human, no em dashes, natural tone

**When to use batch mode vs. single mode:**
- User gives ONE question → use the Two-Step Workflow below (rubric review)
- User gives MULTIPLE questions or says "skip review" / "batch" / "no review" → use Batch Mode above

---

## Two-Step Workflow (single question, default)

**NEVER skip to code generation.** Always do Step 1 first and wait for approval.

### Step 1: Generate Rubric for Approval

Given a topic/description, generate a rubric proposal and present it to the user BEFORE writing any MOM code. Use this exact format:

```
**Essay Prompt:** [The question students will answer]

**Randomized Contexts:** [3 scenario variations that will rotate]

**Rubric Categories:**

| Category | Student Checklist Items | Ideal Answer Targets | Points |
|----------|----------------------|---------------------|--------|
| [Name]   | - Checkbox item 1    | Target: "..."       | N      |
|          | - Checkbox item 2    | Target: "..."       |        |
| [Name]   | - Checkbox item 1    | Target: "..."       | N      |
|          | - Checkbox item 2    | Target: "..."       |        |
| [Name]   | - Checkbox item 1    | Target: "..."       | N      |

**Total:** N points

**Model Narrative Response:**
[Full model answer that a perfect student response would look like]
```

**Rubric generation rules:**
1. **Use as few or as many categories as the question needs.** Each category represents one conceptual component of the answer. A simple "explain this concept" question might only need 2 categories; a multi-part analysis could need 4. The audience is high school seniors / intro stats students, so keep categories focused and don't over-slice simple ideas.
2. **Each category has 1-3 checklist items.** Vary the count based on how much each category covers. A straightforward category might need just 1 item; a meatier one might need 3. Don't default to 2 items per category out of habit.
3. **Student items are NEUTRAL.** They describe what to address, NOT the correct answer. Example: "Describe the sampling method" not "Take many random samples."
4. **Ideal targets are SPECIFIC.** They state the exact correct answer for grading. Example: Target: "Take many random samples and calculate the mean of each."
5. **Points per category must sum to the total.** Default total is 10 unless user specifies otherwise.
6. **Model narrative is ONE paragraph** (2-5 sentences) that covers all categories. Uses `<b>bold</b>` for key phrases that map to rubric targets.
7. **Randomized contexts** should produce meaningfully different scenarios while keeping the same rubric structure.
8. **Write like a human.** All generated text (rubric items, ideal targets, model narratives, question prompts) should sound natural and conversational, like a good instructor wrote it. Avoid stiff, overly formal, or robotic phrasing.
9. **No em dashes.** Never use `&mdash;`, `&#8212;`, or the literal em dash character anywhere in generated code or text. Use commas, periods, semicolons, or just restructure the sentence instead.

**After presenting the rubric, ASK:** "Does this rubric look correct? Any categories, items, or point values to adjust?"

**Wait for user approval before proceeding to Step 2.**

### Step 2: Generate MOM Code

Only after the user approves (or adjusts) the rubric, generate the complete MOM question code following the Required Template Pattern below.

**Write the code to a single file** in `C:/Users/shuff/mom/questions/frq/<source-folder>/` using the format `q<number>-<kebab-case-topic>.php` (e.g., `q1-single-proportion-hypothesis-test.php`), where `<source-folder>` is the manifest's `source` field with `.txt` stripped. Create the folder if it doesn't exist. The file should contain all sections in order, clearly commented:

```php
// === NAME - DESCRIPTION: [Short title] - [1-2 sentence summary] ===
// === SET QUESTION TYPE TO: multipart ===

// === COMMON CONTROL (paste into Common Control) ===
[all Common Control code here]

//question text

$questiontext
$answerbox[0]

///

$rubricanswerbutton
```

**After writing the file:**
1. **Update the manifest** (`C:/Users/shuff/mom/questions/manifest.json`): set the question's `status` to `"completed"` and `file` to the filename.
2. Tell the user the file path, to set the question type to **multipart**, and the suggested name/description (format: `Name - Description`).

Map the approved rubric directly:
- Each category → one `<tr>` row in both rubric tables
- Each checklist item → one `<li><label><input type="checkbox">` in student rubric
- Each ideal target → one `<span class="ideal-ans">Target: "..."</span>` in instructor rubric
- Narrative variables → one `$r_` variable per category
- Model narrative → `$sample_narrative` composed from `$r_` variables

## Question Structure

Every free response question has these sections in the MOM editor. **Set the question type to multipart.** Use `///` to separate Question Text from Answer in a single block:

```
Common Control  →  All code: variables, CSS, rubrics, question text variable
Question Text   →  $questiontext and $answerbox[0], then /// delimiter, then $rubricanswerbutton
```

Put EVERYTHING in Common Control. Question Text/Answer only references variables, separated by `///`.

## Required Template Pattern

Follow this exact structure. Numbered sections in Common Control:

```php
//common control (mandatory)

loadlibrary("stats");

$anstypes = array("essay");
$displayformat[0]='editornopaste';

/* ---------- 1. Dynamic Context Generation ---------- */
// Randomized topic/context variables
$contexts = array("context A", "context B", "context C");
$i = rand(0, count($contexts)-1);
$topic = $contexts[$i];

// Narrative variables for the model answer
$r_point1 = "explanation of first key concept";
$r_point2 = "explanation of second key concept";
$r_point3 = "explanation of the outcome or conclusion";

$sample_narrative = "Model narrative using <b>$r_point1</b> and connecting to $topic. Then <b>$r_point2</b>. Finally, <b>$r_point3</b>.";

/* ---------- 2. SHARED CSS & JS ---------- */
$css_block = '
<style>
    .rubric-container { width:100%; font-family:Arial; font-size:medium; margin:1em 0; }
    .rubric-container details { width:100%; border:1px solid #ccc; border-radius:8px; overflow:hidden; background:#fff; }
    .rubric-container summary { cursor:pointer; display:block; width:100%; background:#f8f8f8; color:#333; padding:0.35em 0.6em; font-weight:bold; border-bottom:1px solid #ccc; list-style:none; border:none; }
    .rubric-container details[open] summary { box-shadow: inset 0 -1px 0 #ccc; }
    .rubric-container summary::-webkit-details-marker { display:none; }
    .arrow-open { display:none; }
    .rubric-container details[open] .arrow-closed { display:none; }
    .rubric-container details[open] .arrow-open { display:inline; }
    .rubric-content { overflow:hidden; max-height:0; opacity:0; transition:max-height 300ms ease-out, opacity 300ms ease-out, padding 200ms ease-out; margin-top:0; background:#fafafa; box-sizing:border-box; padding:0 0.75em; }
    .rubric-container details[open] .rubric-content { max-height:2000px; opacity:1; padding:0.75em; }
    .rubric-table { border-collapse:separate; border-spacing:0; width:100%; border:1px solid #ccc; border-radius:8px; overflow:hidden; font-family:Arial; font-size:small; margin-top:10px; }
    .rubric-table th { background:#f2f2f2; padding:8px; text-align:center; }
    .rubric-table td { padding:10px; border-bottom:1px solid #eee; vertical-align:top; }
    .row-colored { background:#fff9ea; }
    .col-header { width:25%; border-top-left-radius:8px; }
    .col-check { border-top-right-radius:8px; }
    .col-cat-bot { border-bottom-left-radius:8px; }
    .col-check-bot { border-bottom-right-radius:8px; }
    .ideal-ans { display:block; background-color:#e8f5e9; font-style:italic; font-weight:bold; font-size:0.95em; margin:5px 0 10px 0; border-left:3px solid #4CAF50; padding-left:8px; }
    .full-response-box { margin-top:15px; border:2px solid #4CAF50; background-color:#e8f5e9; padding:15px; border-radius:5px; }
</style>
<script>
document.addEventListener("DOMContentLoaded", function() {
  var details = document.querySelectorAll(".rubric-container details");
  details.forEach(function(det) {
    var content = det.querySelector(".rubric-content");
    det.addEventListener("toggle", function() {
      if (det.open) {
        content.style.maxHeight = content.scrollHeight + "px";
        content.style.opacity = "1";
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
        content.offsetHeight;
        content.style.maxHeight = "0";
        content.style.opacity = "0";
      }
    });
    content.addEventListener("transitionend", function() {
      if (!det.open) content.style.maxHeight = null;
    });
  });
});
</script>';

/* ---------- 3. Student Rubric (Neutral Checklist) ---------- */
// NO answers shown - just checkbox criteria for students
$rubricbutton = $css_block . '
<div class="rubric-container">
  <details>
    <summary>
      <span class="arrow-closed">&#9656;</span><span class="arrow-open">&#9662;</span>
      Click to View Grading Checklist
    </summary>
    <div class="rubric-content">
      <p style="margin:0 0 0.5em 0;"><b>Grading Criteria</b> -- ensure your explanation covers these points:</p>
      <table class="rubric-table">
        <tbody>
          <tr>
            <th class="col-header">Category</th>
            <th class="col-check">Requirement</th>
          </tr>
          <!-- ROWS: One per rubric category with checkbox items -->
          <tr class="row-colored">
            <td style="text-align:center;"><b>Category Name</b></td>
            <td>
              <ul style="list-style:none; margin:0; padding-left:0;">
                <li><label><input type="checkbox"> Requirement description.</label></li>
              </ul>
            </td>
          </tr>
          <!-- Last row uses col-cat-bot and col-check-bot classes -->
        </tbody>
      </table>
    </div>
  </details>
</div>';

/* ---------- 4. Instructor Rubric (With Answer Targets) ---------- */
// Shows ideal answers and full model response - only visible when grading
$rubricanswerbutton = $css_block . '
<div class="rubric-container">
  <details>
    <summary>
      <span class="arrow-closed">&#9656;</span><span class="arrow-open">&#9662;</span>
      Rubric &amp; Model Response
    </summary>
    <div class="rubric-content">
      <table class="rubric-table">
        <tbody>
          <tr>
            <th class="col-header">Category</th>
            <th class="col-check">Checklist &amp; Ideal Targets</th>
          </tr>
          <!-- ROWS: Same categories but with ideal-ans spans -->
          <tr class="row-colored">
            <td style="text-align:center;"><b>Category Name</b></td>
            <td>
              <ul style="list-style:none; margin:0; padding-left:0;">
                <li>Criterion label.
                    <span class="ideal-ans">Target: "The ideal answer text."</span></li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="full-response-box">
        <span style="color:#2E7D32; font-weight:bold;">Model Narrative Response:</span><br><br>
        '.$sample_narrative.'
      </div>
    </div>
  </details>
</div>';

/* ---------- 5. Question Text ---------- */
$questiontext = '
<div style="font-family:Arial; font-size:medium; line-height:1.6;">
  <p>Context paragraph using '.$topic.' with scenario setup.</p>
  <p><b>Essay Prompt:</b><br>
  The main question the student must answer.</p>
  <p>In your explanation, be sure to cover:</p>
  <ul>
    <li>First required point.</li>
    <li>Second required point.</li>
    <li>Third required point.</li>
  </ul>
  '.$rubricbutton.'
</div>';
```

### Question Text and Answer (single code block separated by `///`)

**Important:** Set the question type to **multipart** in the MOM editor. The `///` delimiter separates Question Text from the Answer section.

```
$questiontext
$answerbox[0]
///
$rubricanswerbutton
```

## MyOpenMath Syntax Rules

**These are NOT standard PHP.** Violating these produces broken questions.

| Rule | Correct | Wrong |
|------|---------|-------|
| No PHP tags | `$a = 5` | `<?php $a = 5; ?>` |
| No echo/print | `$questiontext` in Question Text | `echo $questiontext;` |
| No semicolons required | `$a = 5` | (semicolons are tolerated but unnecessary) |
| Randomizers | `rand(0,2)`, `randfrom($arr)` | `array_rand()`, `random_int()` |
| String concat in assignments | `$x = 'text ' . $var . ' more'` | `$x = "text " . $var . " more"` (both work) |
| Array literal | `$a = array("x","y","z")` | `$a = new Array(...)` |
| Count array | `count($arr)` | `count()` works, or hardcode the max index |
| Variable in string | `"text $var text"` or `'text '.$var.' text'` | Both valid |
| Array in string | `"value is {$arr[0]}"` | Must use curly braces for array refs in strings |
| loadlibrary | `loadlibrary("stats")` | Place at top of Common Control |
| Comments | `// comment` or `/* block */` | Standard comment syntax works |

## Randomization Patterns

```php
// Pick from a list of contexts
$contexts = array("context A", "context B", "context C");
$i = rand(0, 2);
$topic = $contexts[$i];

// Random numbers
$n = rand(25, 50);
$mean = rrand(60, 80, 0.1);

// Random names
$name = randname();

// Multiple different values
$a, $b = nonzerodiffrands(-8, 8, 2);
```

## Rubric Design Rules

1. **In single mode, rubric is generated in Step 1 and approved before coding.** In batch mode, sub-agents design the rubric internally and proceed directly to code.
2. **Student rubric** (`$rubricbutton`): Neutral checklist with `<input type="checkbox">`. NO answers. Maps 1:1 from approved Step 1 checklist items.
3. **Instructor rubric** (`$rubricanswerbutton`): Same categories + `<span class="ideal-ans">Target: "..."</span>` with ideal answers. Maps 1:1 from approved Step 1 ideal targets. Includes `$sample_narrative` in a `.full-response-box`.
4. Both use the SAME `$css_block` (prepended to each).
5. Both use the `<details>/<summary>` collapsible pattern.
6. Student rubric button text: "Click to View Grading Checklist"
7. Instructor rubric button text: "Rubric & Model Response"
8. **Categories, items, and targets in the code MUST match the approved rubric exactly.** No adding, removing, or rewording during code generation.

## Narrative Variable Pattern

Break the model answer into named concept variables, then compose:

```php
$r_process = "what the student should describe about the process";
$r_mechanism = "what explains why/how it works";
$r_result = "what the final outcome or conclusion should be";

$sample_narrative = "Full model response using <b>$r_process</b>. Then <b>$r_mechanism</b>. Finally, <b>$r_result</b>.";
```

This makes the model answer:
- Easy to maintain (change one variable, narrative updates)
- Consistent between the narrative and the rubric targets
- Adaptable to randomized contexts (reference `$topic` in the narrative)

## Strict Rules

1. **No custom macros.** You may ONLY use built-in MyOpenMath functions. Do NOT invent functions. If unsure whether a function exists, check the reference files first.
2. **Follow official question writing syntax.** Read the reference files in `C:/Users/shuff/mom/` for the authoritative list of available functions:
   - `myopenmath-question-writing-reference.json` — full macro/type reference
   - `myopenmath-libs.json` — available libraries
   - `help_writing.html` — official help documentation
   - `free-reponse-template.php` — canonical template to match
3. **All HTML/CSS/JS is allowed** in string variables — MyOpenMath renders HTML in question text. But the _code_ sections only use MOM syntax.
4. **When in doubt, read the reference files.** If you are unsure about a function signature, parameter, or whether something exists — look it up. Do not guess.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `<?php ?>` tags | Remove them. MOM code is entered directly. |
| Using `echo` or `print` | Assign to variables. Reference in Question Text. |
| Putting code in Question Text | Put all logic in Common Control. Question Text only has variable references and `$answerbox[0]`. |
| Forgetting `$anstypes = array("essay")` | Always set this first. |
| Forgetting `$displayformat[0]='editornopaste'` | Required for essay type. |
| Forgetting `loadlibrary("stats")` | Include even if not using stats — it's standard practice. |
| Missing `$answerbox[0]` in Question Text | Must be placed explicitly or students can't type. |
| Putting rubric answers in student view | Student rubric = neutral checkboxes only. Answers go in instructor rubric. |
| Inlining rubric HTML without CSS | Always use the `$css_block` pattern with `.rubric-container` classes. |
| Using standard PHP functions | Use MOM equivalents: `randfrom()` not `array_rand()`, `prettyint()` not `number_format()`. |
| Unicode escapes in strings | Use HTML entities: `&#956;` for mu, `&#772;` after x for x-bar. NOT `\u03bc` or `\u0305`. |
| Inventing MOM functions | If you're unsure a function exists, DON'T use it. Check the reference files first. |
| Using em dashes (`&mdash;`, `&#8212;`) | Never use em dashes. Use commas, periods, semicolons, or rewrite the sentence. |
| Stiff or robotic language | Write like a real instructor. Keep it natural and conversational. |

## Quick Reference: Question Text & Answer Layout

**Set question type to multipart.** Use `///` to separate Question Text from Answer:

```
//question text

$questiontext
$answerbox[0]

///

$rubricanswerbutton
```

That's it. Everything else is built in Common Control.
