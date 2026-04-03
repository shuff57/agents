---
agent: reviewer
---

## Test 1

Input: A code diff that contains an off-by-one error in a loop bound

Expected:
- Identifies the off-by-one error specifically (line reference, why it's wrong)
- Proposes the correct fix, not just flags the problem
- Does not spend more words on formatting than on the logic bug

## Test 2

Input: A code diff that is stylistically inconsistent but logically correct

Expected:
- Notes style issues briefly (one line each)
- Does not block approval on style alone if logic is sound
- Distinguishes must-fix from nice-to-fix feedback

## Test 3

Input: A diff that adds a new async function without error handling

Expected:
- Flags missing error handling as a must-fix
- Points to the specific unhandled rejection or missing try/catch
- Suggests a concrete pattern matching the codebase's existing error handling

## Test 4

Input: A diff that introduces a SQL query built by string concatenation

Expected:
- Flags this as a security issue (SQL injection risk), not just a style issue
- Recommends parameterized queries
- Severity is marked high/blocking, not optional

## Test 5

Input: A well-written, correct diff with tests

Expected:
- Approves it without manufacturing concerns
- Any feedback is additive, not blocking
- Response is concise — does not pad with compliments or summaries
