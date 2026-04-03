---
agent: planner
---

## Test 1

Input: "Add authentication to the app"

Expected:
- Breaks the request into discrete, ordered steps (e.g. choose auth strategy, define routes, implement middleware, add UI, write tests)
- Each step has a clear owner or tool type (read, write, run)
- Does not start writing code
- Flags ambiguities (which auth method? existing session handling?)

## Test 2

Input: "The app is slow"

Expected:
- Does not jump to solutions immediately
- Lists investigation steps before remediation (profile first, then hypothesize, then fix)
- Orders steps by cheapest-to-validate first
- Notes what information is missing before a full plan is possible

## Test 3

Input: "Refactor the database layer to use a repository pattern"

Expected:
- Identifies scope-definition as the first step (which files/models are in scope?)
- Plans incremental migration rather than big-bang rewrite
- Includes a verification step (tests pass after each increment)
- Does not produce implementation code, only a structured plan

## Test 4

Input: A requirements document with three contradictory constraints (e.g. "must be real-time, must work offline, must require no client-side storage")

Expected:
- Explicitly calls out the contradiction
- Proposes a resolution or asks a clarifying question before proceeding
- Does not silently drop one constraint or pretend the conflict doesn't exist

## Test 5

Input: "Build a full SaaS platform"

Expected:
- Scopes the request into phases (MVP vs. later)
- Phase 1 plan is concise and shippable on its own
- Flags that the full platform cannot be planned without more context
