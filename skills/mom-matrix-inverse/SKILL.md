## Skill: mom-matrix-inverse

**Use when writing MyOpenMath matrix inverse + equation questions, creating MOM combined matrix question code, or authoring IMathAS matrix assessment items that ask students to find A⁻¹ and solve AX=B.**

## Overview

Write production-ready MyOpenMath matrix questions that combine two connected parts:
1. **Part 0** — Student finds A⁻¹ (the inverse of matrix A)
2. **Part 1** — Student solves AX = B using the inverse method (X = A⁻¹B)
3. **Part 2** — File upload for hand-written work

Both parts use the **same matrix A**, making them pedagogically connected. Finding the inverse is the *method* for solving the equation.

## When to Use

- User asks to write a MyOpenMath matrix inverse question
- User asks to write a combined "find inverse and solve equation" question
- User wants a MOM question where AX=B is solved via A⁻¹
- User asks for a matrix question with both an inverse box and a solution vector box

Do NOT use for:
- RREF / row reduction questions (those use `matrixdisplaytable`, different pattern)
- Essay / free response questions (use `mom-frq` skill instead)
- General matrix operations (determinants, eigenvalues, etc.)

## Workflow

Simple single-step — no rubric review, no batch mode. User specifies size (2 or 3), you generate the file directly.

1. Determine size: 2x2 or 3x3 (ask if not specified)
2. Write the file to `C:/Users/shuff/mom/questions/matrix/matrix-{2x2|3x3}-inverse-equation.php`
3. Run grep verification (see QA Checks below)
4. Report the file path and paste instructions

## Template Pattern

### 2×2 Version

```
// === NAME - DESCRIPTION: Matrix Inverse & Equation (2x2) - Find A^{-1} then solve AX=B using the inverse method ===

// === COMMON CONTROL ===

loadlibrary("matrix")

$m,$mi = matrixrandinvertible(2)
$md = matrixformat($m)

$x = matrix(nonzerodiffrands(-5,5,2),2,1)
$b = matrixprod($m,$x)
$bd = matrixformat($b)

$anstypes = array("matrix", "matrix", "file")
$answer[0] = matrixformat($mi)
$answersize[0] = "2,2"
$answer[1] = matrixformat($x)
$answersize[1] = "2,1"
$answerformat[2] = "images,.pdf"
// Omitting $scoremethod[2] leaves the upload scored as 0 until manually graded.
// To auto-grant full credit for any submission, add: $scoremethod[2] = "takeanything"

// --- Solution guide ---
$mid = matrixformat($mi)
$xd = matrixformat($x)

$solutionguide = '
<div style="font-family:Arial;font-size:medium;margin:1em 0;border:2px solid #ccc;border-radius:8px;overflow:hidden;">
  <details>
    <summary style="cursor:pointer;padding:0.6em 1em;background:#f0f4ff;font-weight:bold;list-style:none;border-bottom:1px solid #ccc;">
      &#9658; Step-by-Step Solution
    </summary>
    <div style="padding:1em 1.4em;line-height:1.8;">
      <p style="margin:0 0 0.4em;"><b>Given:</b>&nbsp; AX = B</p>
      <p style="margin:0 0 0.8em 1.5em;"><b>A</b> = ' . $md . '&nbsp;&nbsp;&nbsp;<b>B</b> = ' . $bd . '</p>

      <p style="margin:0 0 0.4em;"><b>Step 1:</b> Compute A<sup>&minus;1</sup></p>
      <p style="margin:0 0 0.8em 1.5em;"><b>A<sup>&minus;1</sup></b> = ' . $mid . '</p>

      <p style="margin:0 0 0.4em;"><b>Step 2:</b> Multiply X = A<sup>&minus;1</sup>B</p>
      <div style="margin:0 0 0.5em 1.5em;padding:0.6em 1em;background:#e8f5e9;border-left:4px solid #4CAF50;border-radius:0 6px 6px 0;display:inline-block;">
        <b>X</b> = ' . $xd . '
      </div>
    </div>
  </details>
</div>'

// === QUESTION TEXT ===

Solve the matrix equation `A X = B` for `X` by finding `A^{-1}`. Upload a photo of your hand-written work.

`A = $md, \ \ B = $bd`

`A^{-1}` = $answerbox[0]

`X` = $answerbox[1]

Work upload: $answerbox[2]

// === ANSWER ===

$solutionguide
```

### 3×3 Version

Same structure. Change these values:
- `matrixrandinvertible(2)` → `matrixrandinvertible(3)`
- `nonzerodiffrands(-5,5,2)` → `nonzerodiffrands(-4,4,3)` (smaller range to keep b entries manageable)
- `matrix(...,2,1)` → `matrix(...,3,1)`
- `$answersize[0] = "2,2"` → `$answersize[0] = "3,3"`
- `$answersize[1] = "2,1"` → `$answersize[1] = "3,1"`
- Description comment: `(3x3)`

## Solution Guide

The `$solutionguide` is an instructor-only collapsible section placed in the Answer field (after `// === ANSWER ===`). Students never see it — it only appears when an instructor clicks "Show Answer" or reviews the question.

### Structure

```
// --- Solution guide ---
$mid = matrixformat($mi)   // formatted inverse for display
$xd = matrixformat($x)    // formatted solution vector for display

$solutionguide = '
<div style="font-family:Arial;font-size:medium;margin:1em 0;border:2px solid #ccc;border-radius:8px;overflow:hidden;">
  <details>
    <summary style="cursor:pointer;padding:0.6em 1em;background:#f0f4ff;font-weight:bold;list-style:none;border-bottom:1px solid #ccc;">
      &#9658; Step-by-Step Solution
    </summary>
    <div style="padding:1em 1.4em;line-height:1.8;">

      <!-- Given block: shows A and B -->
      <p style="margin:0 0 0.4em;"><b>Given:</b>&nbsp; AX = B</p>
      <p style="margin:0 0 0.8em 1.5em;"><b>A</b> = ' . $md . '&nbsp;&nbsp;&nbsp;<b>B</b> = ' . $bd . '</p>

      <!-- Step 1: the inverse -->
      <p style="margin:0 0 0.4em;"><b>Step 1:</b> Compute A<sup>&minus;1</sup></p>
      <p style="margin:0 0 0.8em 1.5em;"><b>A<sup>&minus;1</sup></b> = ' . $mid . '</p>

      <!-- Step 2: final answer in green box -->
      <p style="margin:0 0 0.4em;"><b>Step 2:</b> Multiply X = A<sup>&minus;1</sup>B</p>
      <div style="margin:0 0 0.5em 1.5em;padding:0.6em 1em;background:#e8f5e9;border-left:4px solid #4CAF50;border-radius:0 6px 6px 0;display:inline-block;">
        <b>X</b> = ' . $xd . '
      </div>
    </div>
  </details>
</div>'
```

### Key Details

| Element | Value | Purpose |
|---------|-------|---------|
| Container border | `#ccc`, `border-radius:8px` | Matches all other matrix question solution guides |
| Summary background | `#f0f4ff` | Light blue header — consistent across all matrix questions |
| `&#9658;` | Right-pointing triangle | Collapsed indicator |
| Green box background | `#e8f5e9` | Highlights the final answer |
| Green box border | `4px solid #4CAF50` | Left-accent bar on final answer |
| `$mid`, `$xd` | Separate display variables | Defined before `$solutionguide` — `matrixformat()` called once each |

### Placement

```
// === ANSWER ===

$solutionguide
```

**Never** place `$solutionguide` in the Question Text section — it would be visible to students.
**No** `///` separator needed — matrix questions output the solution guide directly in the Answer field.

## Required Macros

| Macro | Usage | Purpose |
|-------|-------|---------|
| `loadlibrary("matrix")` | Top of file | Loads matrix library — required |
| `matrixrandinvertible(N)` | `$m,$mi = matrixrandinvertible(N)` | Generates NxN invertible matrix M and M⁻¹ with guaranteed integer entries |
| `matrixformat(mat)` | `$md = matrixformat($m)` | Formats matrix for answer comparison and display |
| `matrix(arr,rows,cols)` | `matrix(nonzerodiffrands(-5,5,2),2,1)` | Constructs matrix from flat array |
| `matrixprod(A,B)` | `$b = matrixprod($m,$x)` | Multiplies two matrices: b = Ax |
| `nonzerodiffrands(min,max,n)` | `nonzerodiffrands(-5,5,2)` | Returns n nonzero distinct integers — use for solution vector |

## Answer Configuration (3-Part Multipart)

| Part | Index | Type | Config |
|------|-------|------|--------|
| A⁻¹ (inverse) | 0 | matrix | `$answer[0] = matrixformat($mi)`, `$answersize[0] = "N,N"` |
| X (solution) | 1 | matrix | `$answer[1] = matrixformat($x)`, `$answersize[1] = "N,1"` |
| Work upload | 2 | file | `$answerformat[2] = "images,.pdf"` — omit `$scoremethod[2]` to score 0 until manual review |

**Critical**: File upload is always index **[2]**, not [1]. There are two matrix parts before it.

**Scoring the upload**: Omitting `$scoremethod[2]` leaves the upload scored as 0 until you manually review and adjust in the gradebook. Adding `$scoremethod[2] = "takeanything"` auto-grants full credit for any submission.

## File Naming

```
matrix-{2x2|3x3}-inverse-equation.php
```

Output folder: `C:/Users/shuff/mom/questions/matrix/`

## QA Checks (run after writing)

```bash
# Structural (all must return 1)
grep -c 'loadlibrary("matrix")' [file]
grep -c 'matrixrandinvertible' [file]
grep -c 'nonzerodiffrands' [file]
grep -c 'answersize\[0\]' [file]
grep -c 'answersize\[1\]' [file]
# (no scoremethod[2] — omitting it scores upload as 0 until manual review)
grep -c 'answerbox\[0\]' [file]
grep -c 'answerbox\[1\]' [file]
grep -c 'answerbox\[2\]' [file]

# Anti-patterns (all must return 0)
grep -c 'loadlibrary("stats")' [file]
grep -c 'css_block' [file]
grep -c 'rubricbutton' [file]
grep -c 'editornopaste' [file]
```

## Anti-Patterns

| Anti-Pattern | Why Wrong |
|---|---|
| `loadlibrary("stats")` | Matrix questions only use `loadlibrary("matrix")` |
| `$css_block` | FRQ-only pattern. Use inline CSS in `$solutionguide` string directly |
| `$rubricbutton` / `$rubricanswerbutton` | FRQ essay patterns only |
| `///` separator | Matrix questions use `// === ANSWER ===` section, not `///` |
| `$displayformat[0] = 'editornopaste'` | Essay-only setting |
| `rands(-7,7,N)` for solution vector | Use `nonzerodiffrands()` to avoid zeros and duplicates |
| `$scoremethod[2] = "takeanything"` (unintended) | Omit it — upload scores 0 by default so you can review before granting credit. Add it only if you want auto-credit for any submission. |
| `$scoremethod[1]` for file upload | File is Part 2 (index 2), not Part 1 |
| `<?php ?>` tags / `echo` / `print` | IMathAS is pseudo-PHP — no PHP tags, no output statements |
| `$contexts` array | Matrix questions use fixed prompt text, no randomized scenarios |

## Common Mistakes

| Mistake | Fix |
|---|---|
| Adding `$scoremethod[2] = "takeanything"` unintentionally | Omit it — upload scores 0 by default, letting you review before granting credit |
| Using `rands()` for x vector | Use `nonzerodiffrands(-5,5,2)` or `nonzerodiffrands(-4,4,3)` |
| Forgetting `$answersize` for both parts | Both `$answersize[0]` (NxN) and `$answersize[1]` (Nx1) are required |
| Using `///` separator | No `///` in matrix questions. Solution guide goes after `// === ANSWER ===` |
| Using `-7,7` range for 3x3 | Use `-4,4` for 3x3 to prevent excessively large b vector entries |
| FRQ patterns leaking in | No `$css_block`, no rubric components, no essay config |

## Reference Files

For macro lookups and answer type configuration, consult:
- `C:/Users/shuff/mom/myopenmath-question-writing-reference.json` — full macro/type reference
  - Lines 732-750: `numericalmatrix` answer type options
  - Lines 904-918: `fileupload` answer type options
  - Lines 919-939: `multipart` answer type configuration
- `C:/Users/shuff/mom/myopenmath-libs.json` — available libraries
- `C:/Users/shuff/mom/mom/questions/matrix/matrix-2x2-inverse-equation.php` — completed 2x2 example
- `C:/Users/shuff/mom/mom/questions/matrix/matrix-3x3-inverse-equation.php` — completed 3x3 example
