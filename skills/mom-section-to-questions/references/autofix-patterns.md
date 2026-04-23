# Autofix Patterns

Known IMathAS pitfalls and their fixes. Apply proactively while writing; apply reactively if MOM's preview shows an error.

## Blocked PHP functions → IMathAS equivalents

| Blocked | Replace with |
|---------|--------------|
| `pow($a, $b)` | `$a^$b` |
| `implode($sep, $arr)` | `joinarray($arr, $sep)` |
| `array_slice($arr, $start, $len)` | `subarray($arr, "$start:" . ($start + $len - 1))` |
| `array_rand($arr)` | `rand(0, count($arr) - 1)` |
| `shuffle($arr)` | `jointshuffle($arr)` (mutates) |
| `number_format($n, $d)` | `makepretty($n)` / `prettyint($n)` / explicit `round($n, $d)` |
| `max(a,b,c)` on raw args | `max(array(a,b,c))` — IMathAS `max` takes an array |
| `min(a,b,c)` on raw args | `min(array(a,b,c))` — same |

## Loop syntax

| C-style | IMathAS |
|---------|---------|
| `for ($i = 0; $i < $n; $i++) { ... }` | `for ($i = 0..$n - 1) { ... }` |
| `while (...) { ... }` | Use a `for` with a range; while loops are restricted |

## Parallel randomization

When you need $n, $displayString, and $answer to all line up:

```
$ns = array(4, 5, 6, 7)
$displays = array("a, b, c, d", "a, b, c, d, e", "a, b, c, d, e, f", "a, b, c, d, e, f, g")
$answers = array(16, 32, 64, 128)
$picked = jointrandfrom($ns, $displays, $answers)
$n = $picked[0]
$set_display = $picked[1]
$answer[0] = $picked[2]
```

`jointrandfrom` picks one element from each array at the same index, guaranteeing alignment.

## Set braces around a variable

Rendering `{$var}` in Question Text or Detailed Solution strips the braces — that's PHP variable-interpolation syntax. Put spaces inside the braces so they stay literal:

```
# BAD — braces get eaten, renders as "S = cat, dog":
<b>S = {$set_display}</b>

# GOOD — braces render literally, renders as "S = { cat, dog }":
<b>S = { $set_display }</b>
```

Same rule applies anywhere you want literal braces around an interpolated variable.

## Variable-index lookups in Question Text

IMathAS text interpolation does NOT resolve `$arr[$i]` where `$i` is a variable. It emits the whole array and raises "Array to string conversion".

```
# BAD — variable index in QT:
<p>The set is { $display_opts[$i] }</p>

# GOOD — precompute scalar in CC:
$set_display = $display_opts[$i]
# then in QT:
<p>The set is { $set_display }</p>
```

Same rule for Detailed Solution.

## Set answer types (ntuple + anyorder)

For questions whose answer is a set of numbers:

```
$anstypes = array("ntuple")
$answer = "{1,2,3,4,5,6,8,10}"
$displayformat[0] = "set"
$answerformat[0] = "anyorder"
```

Verified 2026-04-19: student can enter any bracket style `{ }`, `( )`, `[ ]`, `< >`, in any order, and MOM grades correctly.

If the answer is the EMPTY set, do not use `ntuple` with `"{}"`. Instead, ask for the CARDINALITY (= 0) using `number` type, or structure as a multipart asking for intermediate non-empty sets then the final cardinality.

## Multipart + ntuple

Inside multipart with one ntuple part, use indexed forms:

```
$anstypes = array("ntuple")
$answer = "{1,3,5,7,9}"
$displayformat[0] = "set"
$answerformat[0] = "anyorder"
```

`$answer` (without index) still works because there is only one part, but all other display/format options MUST be indexed (`[0]`).

## Empty rendered set `{  }`

Symptom: preview shows the question but variable inside braces is empty.
Root causes (in order of likelihood):
1. Common Control errored out before setting the variable → check `.question` text for "Error in question:" message.
2. Variable is set via a blocked function → substitute per this file's table.
3. Variable is set via `for` with C-style syntax → rewrite with range syntax.
4. Variable-index lookup in the assignment line is failing silently → use `jointrandfrom` or parallel arrays.

## "missing $anstypes for multipart or conditional question"

Common Control errored before reaching `$anstypes = ...`. Fix the earlier error; `$anstypes` is never the problem itself.

## CodeMirror not syncing on Save

Symptom: save succeeds but on reload CC / QT / solution are empty.
Fix: after `cm.setValue(...)`, call `cm.save()` BEFORE clicking the Save button. The hidden textarea is what gets submitted; `cm.save()` copies editor state into it.

## Add-to-assignment search returns empty

The default search scope is "In Libraries", which does NOT include private unassigned questions when searching by numeric id. Workarounds (in order):

1. Search by the question description — this works in all scopes.
2. Or switch the scope dropdown to "Unassigned" before searching by id.

Pattern 1 is more robust.

## 10-second Playwriter timeout

If `playwriter -e '...'` times out at 10s but the action (navigate, save, click) has likely succeeded:
- Do NOT retry blindly.
- Re-query state in a small follow-up call (URL, element text, assignment table contents).
- Only retry if state confirms the action didn't happen.
