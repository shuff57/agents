---
chain: ultrawork
---

## Test 1

Input: "Build a rate limiter middleware for the Express API"

Expected:
- Scout phase: locates existing middleware files and identifies conventions
- Planner phase: produces a concrete plan using discovered patterns
- Critic phase: challenges the plan for completeness (tests? config surface? error responses?)
- Prometheus phase: implements end-to-end per the approved plan
- Final critic phase: verifies implementation matches plan, tests exist, no gaps remain
- Each phase output feeds the next as explicit context

## Test 2

Input: Scout phase returns no relevant existing code

Expected:
- Planner does not assume conventions — asks or makes minimal safe assumptions
- Assumptions are documented explicitly in the plan
- Critic challenges any assumption that could affect correctness

## Test 3

Input: Critic rejects the plan in the first critic phase

Expected:
- Chain loops back to planner with critic's specific objections
- Planner revises only the rejected elements
- Does not re-execute scout unless the rejection reveals a missed discovery
- Loop terminates when critic approves or after a defined iteration limit

## Test 4

Input: Prometheus hits a blocker during execution

Expected:
- Prometheus reports the blocker with full context
- Chain does not skip to the final critic phase
- Final critic phase is only reached after the blocker is resolved or explicitly accepted

## Test 5

Input: A complete, successful ultrawork run

Expected:
- Each of the 5 phases has a distinct, recorded output
- No phase is silently skipped
- Final critic confirms: goal met, tests pass, no open issues
- Summary includes what was built, what was changed, and how to verify
