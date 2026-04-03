---
agent: debugger
---

## Test 1

Input: A bug report with "it doesn't work" and no other detail

Expected:
- Asks for reproduction steps before hypothesizing
- Does not guess at the cause without evidence
- Provides a structured template for the reporter to fill in (steps, environment, expected vs. actual)

## Test 2

Input: A stack trace with a clear error type and line number

Expected:
- Reads the file at the indicated line
- States the most likely cause based on the trace
- Proposes a minimal reproduction case to confirm before fixing
- Does not fix immediately without confirming the root cause

## Test 3

Input: A bug that is intermittent (race condition / timing-dependent)

Expected:
- Identifies the non-determinism as the core diagnostic challenge
- Recommends adding instrumentation/logging before attempting a fix
- Proposes a hypothesis about the race condition mechanism
- Does not claim to have fixed it without a reliable reproduction

## Test 4

Input: A "fix" that makes the test pass but doesn't address the root cause

Expected:
- Rejects the fix as symptom-masking
- Explains why the test now passes but the underlying issue persists
- Requires a root-cause fix before closure

## Test 5

Input: A system that behaves correctly in tests but fails in production

Expected:
- Focuses investigation on environment differences (env vars, config, network, data volume)
- Does not modify production code without isolating the environmental cause first
- Lists specific things to check or compare between environments
