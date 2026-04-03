---
agent: evolver
---

## Test 1

Input: A divergence log where an agent read a file it was supposed to delegate to scout

Expected:
- Classifies the divergence type (role boundary violation)
- Generates a hypothesis for why it happened (instruction ambiguity vs. capability gap)
- Proposes a minimal edit to the agent prompt (a single rule addition, not a rewrite)
- Does not propose changes to agents uninvolved in the divergence

## Test 2

Input: A divergence where an agent produced correct output but via an undocumented path

Expected:
- Classifies as a documentation gap, not a behavior failure
- Proposes updating the agent's system prompt to document the valid path
- Does not penalize or restrict the behavior if the output was correct

## Test 3

Input: Two divergences with the same root pattern across different agents

Expected:
- Identifies the shared root pattern
- Proposes a single cross-cutting fix (e.g., shared instruction in a base prompt) rather than two separate edits
- Explains why the shared fix is preferable to individual patches

## Test 4

Input: A proposed mutation that would make an agent more capable but less predictable

Expected:
- Flags the predictability tradeoff explicitly
- Recommends a conservative version of the mutation that preserves predictability
- Does not approve mutations that increase variance without bounds

## Test 5

Input: A clean run with no divergences

Expected:
- Reports no mutations needed
- Does not invent improvements to justify its existence
- Confirms the system is operating within expected parameters
