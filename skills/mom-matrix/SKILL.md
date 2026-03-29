## Skill: mom-matrix

**Use when writing MyOpenMath matrix RREF or matrix equation (AX=B) questions.**

Do NOT use for inverse+equation questions (find A⁻¹ and solve AX=B) — use `mom-matrix-inverse` for those.

---

## Question Types

| Type | File pattern | What it asks | Answer parts |
|------|-------------|-------------|-------------|
| RREF | `matrix-{2x2|3x3}-rref.php` | Row reduce augmented matrix to RREF | RREF matrix + file upload |
| Equation | `matrix-{2x2|3x3}-equation.php` | Solve AX = B for X | X vector + file upload |

---

## Shared Foundation (both types)

```
loadlibrary("matrix")          // required — always first
```

- No `$css_block`, no rubric, no essay patterns
- `$solutionguide` is a collapsible `<details>` string placed after `// === ANSWER ===`
- Solution guide header: `background:#f0f4ff` (light blue)
- Final answer in guide: `background:#e8f5e9; border-left:4px solid #4CAF50` (green)
- File upload: `$answerformat[N] = "images,.pdf"`
- Never hardcode matrix entries — always derive from random values

**Workflow**: determine size (2 or 3), write file, run QA checks, report file path.

---

## Type 1: RREF

### When to use
Student sees an augmented matrix and must row reduce it to RREF.

### What makes RREF different from Equation
- Matrix displayed with `matrixdisplaytable()` — NOT `matrixformat()`
- Matrix generated via manual construct-from-solution (NOT `matrixrandinvertible`)
- `$answersize[0]`: `"2,3"` for 2×2, `"3,4"` for 3×3
- File upload: `$scoremethod[1] = "takeanything"` (auto-credit any submission)

### 2×2 RREF Template

```
// === NAME - DESCRIPTION: Matrix RREF (2x2) - Row reduce 2x2 augmented matrix to RREF ===

// === COMMON CONTROL ===

loadlibrary("matrix")

$a = nonzerorand(-2,2)
$c = nonzerorand(-2,2)
$a22 = $a*$c + 1

$x0,$y0 = nonzerodiffrands(-4,4,2)

$b1 = $x0 + $a*$y0
$b2 = $c*$x0 + $a22*$y0

$Aug = matrix(array(1,$a,$b1, $c,$a22,$b2), 2, 3)
$disp = matrixdisplaytable($Aug, "", 1, 1)

$RREF = matrix(array(1,0,$x0, 0,1,$y0), 2, 3)
$anstypes = array("matrix", "file")
$answer[0] = matrixformat($RREF)
$answersize[0] = "2,3"
$scoremethod[1] = "takeanything"
$answerformat[1] = "images,.pdf"

// --- Solution guide ---
$step1 = matrix(array(1,$a,$b1, 0,1,$y0), 2, 3)
$step1d = matrixdisplaytable($step1, "", 1, 1)
$rrefd = matrixdisplaytable($RREF, "", 1, 1)

$solutionguide = '
<div style="font-family:Arial;font-size:medium;margin:1em 0;border:2px solid #ccc;border-radius:8px;overflow:hidden;">
  <details>
    <summary style="cursor:pointer;padding:0.6em 1em;background:#f0f4ff;font-weight:bold;list-style:none;border-bottom:1px solid #ccc;">
      &#9658; Step-by-Step Solution
    </summary>
    <div style="padding:1em 1.4em;line-height:1.8;">
      <p style="margin:0 0 0.4em;"><b>Original augmented matrix:</b></p>
      <div style="margin:0 0 1.2em 1.5em;">' . $disp . '</div>

      <p style="margin:0 0 0.4em;"><b>Step 1:</b> R<sub>2</sub> &larr; R<sub>2</sub> &minus; (' . $c . ')R<sub>1</sub></p>
      <div style="margin:0 0 1.2em 1.5em;">' . $step1d . '</div>

      <p style="margin:0 0 0.4em;"><b>Step 2:</b> R<sub>1</sub> &larr; R<sub>1</sub> &minus; (' . $a . ')R<sub>2</sub></p>
      <div style="margin:0 0 0.5em 1.5em;padding:0.6em 1em;background:#e8f5e9;border-left:4px solid #4CAF50;border-radius:0 6px 6px 0;display:inline-block;">
        ' . $rrefd . '
      </div>
    </div>
  </details>
</div>'

// === QUESTION TEXT ===

<div style="font-family:Arial; font-size:medium; line-height:1.6;">
<p>Row reduce the following augmented matrix to reduced row echelon form. Upload a photo of your hand-written work.</p>
<div style="margin:15px 0; text-align:center;">$disp</div>
</div>

RREF: $answerbox[0]

Work upload: $answerbox[1]

// === ANSWER ===

$solutionguide
```

### 3×3 RREF — what changes

The 3×3 version uses the same construct-from-solution approach with 3 variables and 6 elimination steps.

**Changed variables:**
```
$a,$b = nonzerorand(-2,2)          // row 1 off-diagonal coefficients
$c,$e = nonzerodiffrands(-3,3,2)   // row 2 and row 3 multipliers for col 1
$d = nonzerorand(-2,2)
$f = nonzerorand(-2,2)
$g = $f*$d + 1                     // ensures pivot = 1 at (3,3)

$a22 = $a*$c + 1
$a23 = $b*$c + $d
$a32 = $a*$e + $f
$a33 = $b*$e + $g

$x0,$y0,$z0 = nonzerodiffrands(-4,4,3)

$b1 = $x0 + $a*$y0 + $b*$z0
$b2 = $c*$x0 + $a22*$y0 + $a23*$z0
$b3 = $e*$x0 + $a32*$y0 + $a33*$z0

$Aug = matrix(array(1,$a,$b,$b1, $c,$a22,$a23,$b2, $e,$a32,$a33,$b3), 3, 4)
$RREF = matrix(array(1,0,0,$x0, 0,1,0,$y0, 0,0,1,$z0), 3, 4)
$answersize[0] = "3,4"
```

**6-step solution guide** (forward elimination then back substitution):
- Step 1: R2 ← R2 − (c)R1
- Step 2: R3 ← R3 − (e)R1
- Step 3: R3 ← R3 − (f)R2
- Step 4: R2 ← R2 − (d)R3
- Step 5: R1 ← R1 − (b)R3
- Step 6: R1 ← R1 − (a)R2 (= RREF, shown in green box)

Each step: compute an intermediate `matrix()` object, render with `matrixdisplaytable()`.

---

## Type 2: Equation (Solve AX = B)

### When to use
Student is given A and B and must solve AX = B for X. Method is not prescribed — instructor guide shows the inverse method.

### What makes Equation different from RREF
- Matrix generated with `matrixrandinvertible(N)` (not manual construct)
- x vector uses `rands(-7,7,N)` — NOT `nonzerodiffrands`
- `$answersize[0]`: `"2,1"` for 2×2, `"3,1"` for 3×3
- Solution guide shows A⁻¹ for reference but student is NOT asked to enter it

### 2×2 Equation Template

```
// === NAME - DESCRIPTION: Matrix Equation (2x2) - Solve AX=B for X ===

// === COMMON CONTROL ===

loadlibrary("matrix")

$m,$mi = matrixrandinvertible(2)
$md = matrixformat($m)

$x = matrix(rands(-7,7,2),2,1)
$b = matrixprod($m,$x)
$bd = matrixformat($b)

$anstypes = array("matrix", "file")
$answer[0] = matrixformat($x)
$answersize[0] = "2,1"
$scoremethod[1] = "takeanything"
$answerformat[1] = "images,.pdf"

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

Solve the matrix equation `A X = B` for `X`. Upload a photo of your hand-written work.

`A = $md, \ \ B = $bd`

`X` = $answerbox[0]

Work upload: $answerbox[1]

// === ANSWER ===

$solutionguide
```

### 3×3 Equation — what changes

```
$m,$mi = matrixrandinvertible(3)
$x = matrix(rands(-7,7,3),3,1)
$answersize[0] = "3,1"
// Description: (3x3)
```

Everything else is identical. The solution guide HTML does not change.

---

## Key Differences Between Types

| | RREF | Equation |
|---|---|---|
| Matrix gen | manual construct-from-solution | `matrixrandinvertible()` |
| Display macro | `matrixdisplaytable()` | `matrixformat()` |
| x vector | `nonzerodiffrands(-4,4,N)` | `rands(-7,7,N)` |
| Answer[0] | RREF augmented matrix | X solution vector |
| answersize[0] | `"2,3"` / `"3,4"` | `"2,1"` / `"3,1"` |
| Upload scoring | `$scoremethod[1] = "takeanything"` | `$scoremethod[1] = "takeanything"` |

---

## File Naming

```
matrix-{2x2|3x3}-{rref|equation}.php
```

Output folder: `C:/Users/shuff/Documents/GitHub/mom/mom/questions/matrix/`

---

## QA Checks (run after writing)

```bash
# All must return 1
grep -c 'loadlibrary("matrix")' [file]
grep -c 'matrixformat' [file]
grep -c 'solutionguide' [file]
grep -c 'answerbox\[0\]' [file]
grep -c 'answerformat' [file]

# Anti-patterns — all must return 0
grep -c 'loadlibrary("stats")' [file]
grep -c 'css_block' [file]
grep -c 'rubricbutton' [file]
grep -c 'editornopaste' [file]
grep -c '<?php' [file]
grep -c 'echo ' [file]
```

---

## Anti-Patterns

| Anti-Pattern | Why Wrong |
|---|---|
| `loadlibrary("stats")` | Matrix questions use `"matrix"` only |
| `$css_block` | FRQ-only. Use inline CSS in `$solutionguide` |
| `$rubricbutton` / `$rubricanswerbutton` | FRQ essay patterns only |
| `///` separator | Matrix questions use `// === ANSWER ===`, not `///` |
| `$displayformat[0] = 'editornopaste'` | Essay-only setting |
| `matrixformat()` in RREF questions | Use `matrixdisplaytable()` for augmented matrices |
| `matrixdisplaytable()` in Equation questions | Use `matrixformat()` for square/column matrices |
| `nonzerodiffrands()` for Equation x vector | Use `rands(-7,7,N)` — Equation allows zeros and repeats |
| Hardcoded matrix entries | Always derive from random solution values |
| `<?php ?>` tags / `echo` / `print` | IMathAS is pseudo-PHP — no output statements |

---

## Reference Files

- `C:/Users/shuff/Documents/GitHub/mom/mom/questions/matrix/matrix-2x2-rref.php`
- `C:/Users/shuff/Documents/GitHub/mom/mom/questions/matrix/matrix-3x3-rref.php`
- `C:/Users/shuff/Documents/GitHub/mom/mom/questions/matrix/matrix-2x2-equation.php`
- `C:/Users/shuff/Documents/GitHub/mom/mom/questions/matrix/matrix-3x3-equation.php`
