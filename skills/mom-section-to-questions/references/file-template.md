# .php File Template

The file format this skill writes. Matches the existing MOM question repo convention (see `questions/*/q*-*.php`).

## Section markers

Each file has three marker comments that the MOM loop parses back out:

```
// === NAME - DESCRIPTION: <title> - <one-line description> ===
// === SET QUESTION TYPE TO: <type> ===

// === COMMON CONTROL ===
<IMathAS pseudo-PHP: answer types, randomization, $answer, $solutionguide>

// === QUESTION TEXT ===
<HTML for the student, with $answerbox[N] placeholders and $variable interpolation>

// === ANSWER ===
$solutionguide
```

The parser:

```js
const name = content.match(/DESCRIPTION:\s*([\s\S]*?)===/)?.[1]?.trim();
const cc   = content.match(/\/\/ === COMMON CONTROL ===\s*\n([\s\S]*?)\n\/\/ === QUESTION TEXT ===/)?.[1].trim();
const qt   = content.match(/\/\/ === QUESTION TEXT ===\s*\n([\s\S]*?)\n\/\/ === ANSWER ===/)?.[1].trim();
const ans  = content.match(/\/\/ === ANSWER ===\s*\n([\s\S]*)$/)?.[1].trim();
```

## Template for a multipart with mixed answer types

```
// === NAME - DESCRIPTION: <Short Title> - <One-line description> ===
// === SET QUESTION TYPE TO: multipart ===

// === COMMON CONTROL ===

$anstypes = array("number", "ntuple", "number")

// --- Randomization (use MOM macros only; see autofix-patterns.md) ---
$picked = jointrandfrom($ns, $displays, $answers)
$n = $picked[0]
$set_display = $picked[1]

// --- Answers ---
$answer[0] = <numeric>
$answer[1] = "{1,3,5,7,9}"
$displayformat[1] = "set"
$answerformat[1] = "anyorder"
$answer[2] = <numeric>

// --- Solution (rendered in Detailed Solution) ---
$solutionguide = '
<style> ... </style>
<div class="sol-wrap" ...>
  <details>
    <summary>
      <span class="sol-arrow-closed">&#9656;</span><span class="sol-arrow-open">&#9662;</span>
      Step-by-Step Solution
    </summary>
    <div class="sol-body">
      <p>...</p>
    </div>
  </details>
</div>'

// === QUESTION TEXT ===

<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:16px; line-height:1.6; color:#21242c; max-width:688px;">
  <div style="background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:20px; margin:10px 0; box-shadow:0 4px 6px -1px rgba(0,0,0,0.07),0 2px 4px -2px rgba(0,0,0,0.04);">
    <p style="margin:0;">Intro / setup text here.</p>
  </div>
  <div style="background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:20px; margin:10px 0; box-shadow:0 4px 6px -1px rgba(0,0,0,0.07),0 2px 4px -2px rgba(0,0,0,0.04);">
    <span style="display:inline-block; background:#e8f0fe; color:#1865f2; border-radius:6px; padding:3px 10px; font-size:13px; font-weight:700; margin-right:10px; vertical-align:middle;">a.</span> First question prompt.
    <div style="margin-top:12px;text-align:center;">$answerbox[0]</div>
  </div>
  <div style="background:#fff; ... (repeat card for each part) ...">
    <span style="... part chip ...">b.</span> Second prompt.
    <div style="margin-top:12px;text-align:center;">$answerbox[1]</div>
  </div>
</div>


// === ANSWER ===

$solutionguide
```

## Rules

- Always reference `mom-style-guide` for voice, rubric, colors, and layout BEFORE writing.
- Always reference `mom-frq` for answer-type scaffolds and macro signatures.
- The card-per-part layout (white card with rounded corners + blue chip label) is the house standard. Do not use bare `<p>` tags or bare `<br>` before `$answerbox[n]`.
- Never use `display:none` anywhere in QT; screen readers must see every part.
- Do not set `$css_block` for multipart; that is for FRQ.
- File name pattern: `q{N}-{kebab-slug}.php` where N matches the order the teacher approved.
