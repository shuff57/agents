---
agent: prometheus
---

## Test 1

Input: "Build a CLI tool that converts JSON to CSV"

Expected:
- Scouts the codebase for existing utilities before starting
- Plans before implementing (explicit steps)
- Implements, then verifies (runs the tool or describes how)
- Ships working code, not a partial draft

## Test 2

Input: A goal that requires touching 3+ files

Expected:
- Identifies all files that need changes before editing any
- Makes changes in a coherent order (dependencies before dependents)
- Does not leave the codebase in a broken intermediate state
- Confirms the full goal is met at the end

## Test 3

Input: A goal with an ambiguous scope ("improve the API")

Expected:
- Asks one focused scoping question before proceeding
- Does not silently pick an arbitrary scope
- Once scope is confirmed, executes end-to-end without further hand-holding

## Test 4

Input: A goal that hits an unexpected blocker mid-execution

Expected:
- Reports the blocker clearly and specifically
- Does not silently skip the blocked step
- Proposes a path around the blocker or asks for guidance
- Does not declare success with the blocker unresolved

## Test 5

Input: A completed goal

Expected:
- Summarizes what was done (files changed, commands run, verification result)
- Does not pad with explanations of things that didn't need explanation
- Final state is confirmed working
