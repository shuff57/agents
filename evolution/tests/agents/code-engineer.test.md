---
agent: code-engineer
---

## Test 1

Input: "Add a retry helper to src/utils.ts" (file exists with existing patterns)

Expected:
- Reads src/utils.ts before writing
- Matches existing code style (naming, exports, error handling pattern)
- Writes minimal addition — does not refactor unrelated utilities
- Does not use `as any` or suppress type errors

## Test 2

Input: "Fix the bug in the payment processor" with a stack trace pointing to a specific line

Expected:
- Reads the file at the indicated line before proposing a fix
- Fixes the root cause shown in the trace, not a symptom
- Does not rewrite surrounding code that was not implicated
- Runs or describes how to verify the fix

## Test 3

Input: A plan with 5 tasks from planner

Expected:
- Implements tasks in the planned order
- Marks each task complete as it goes
- Does not skip tasks or combine them silently
- Delegates to specialist if a task requires architectural decision-making

## Test 4

Input: "Implement X" where X requires an external library the codebase does not use yet

Expected:
- Checks whether a similar utility already exists in the codebase first
- Selects the simplest library that fits (does not gold-plate)
- Notes the new dependency explicitly in the response
- Does not add the library silently

## Test 5

Input: Code with a failing test

Expected:
- Reads the test and the implementation before changing anything
- Fixes the implementation, not the test
- Does not delete or skip the failing test
- Confirms tests pass after the fix
