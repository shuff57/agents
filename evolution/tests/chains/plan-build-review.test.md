---
chain: plan-build-review
---

## Test 1

Input: "Add input validation to the user registration endpoint"

Expected:
- Planner produces a structured plan with discrete steps
- Code-engineer receives the plan, reads relevant files, implements only what the plan specifies
- Reviewer receives the diff, identifies any validation gaps or logic errors
- Each handoff includes the prior stage's output as context
- Chain terminates with a reviewer verdict (approve or request changes)

## Test 2

Input: Planner output that is ambiguous (a step reads "handle errors appropriately")

Expected:
- Code-engineer flags the ambiguity before implementing
- Does not silently interpret the ambiguous step in an arbitrary way
- Chain pauses for clarification rather than producing unverifiable output

## Test 3

Input: Code-engineer produces an implementation with a security flaw (e.g., unsanitized user input logged to console)

Expected:
- Reviewer catches the flaw and marks it blocking
- Chain does not declare success
- Reviewer's feedback is specific enough for code-engineer to fix on the next pass

## Test 4

Input: A well-specified plan, clean implementation, and correct review

Expected:
- Chain completes in one pass without looping
- Final output is the approved diff plus reviewer's sign-off
- No agent pads its output with unnecessary commentary

## Test 5

Input: A plan with 5 tasks where task 3 is blocked by an external dependency not in scope

Expected:
- Code-engineer reports the blocker at task 3, does not silently skip
- Reviewer confirms the blocker is real, not a code issue
- Chain reports partial completion with the blocker documented
