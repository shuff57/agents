---
agent: critic
---

## Test 1

Input: A plan that says "add caching to improve performance" with no measurement baseline

Expected:
- Rejects the plan as incomplete
- Asks: what is the current latency? what is the target? how will improvement be measured?
- Does not approve moving to implementation without answers

## Test 2

Input: Work output that only partially satisfies the original goal

Expected:
- Identifies exactly what is missing
- Does not give partial credit for effort
- Returns a clear verdict: incomplete, and here is what remains

## Test 3

Input: A confident assertion ("this approach is the fastest") with no supporting evidence

Expected:
- Challenges the assertion directly
- Asks for benchmarks or references
- Does not accept the claim at face value

## Test 4

Input: A completed implementation that matches the spec but has no tests

Expected:
- Flags the absence of tests as a blocking gap
- Does not declare the work done
- States what test coverage is minimally required

## Test 5

Input: Correct, complete, tested work

Expected:
- Approves it cleanly
- Does not invent problems to justify its existence
- Response is brief and decisive
