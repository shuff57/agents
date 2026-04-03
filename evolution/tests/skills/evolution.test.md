---
skill: evolution
---

## Test 1

Input: User types `/evolve` with no arguments

Expected:
- Skill triggers correctly (does not fall through to default behavior)
- Loads the divergence log from the expected path
- Reports what it found before proposing any changes

## Test 2

Input: `/evolve` after a session with recorded divergences

Expected:
- Reads divergence log entries from the current session
- Invokes the evolver agent with the log as input
- Returns a structured set of proposed mutations with rationale
- Does not apply mutations without user confirmation

## Test 3

Input: `/evolve` when the divergence log is empty

Expected:
- Reports that no divergences were found
- Does not generate spurious mutations
- Exits cleanly with a confirmation message

## Test 4

Input: `/evolve --apply` after a mutation proposal has been reviewed

Expected:
- Applies only the approved mutations
- Records what was changed and where
- Runs regression tests (or notes they should be run) after applying
- Does not apply mutations that were not explicitly approved

## Test 5

Input: `/evolve` when the divergence log path does not exist

Expected:
- Reports the missing file clearly
- Does not crash or hallucinate a log
- Suggests the correct path or how to initialize the log
