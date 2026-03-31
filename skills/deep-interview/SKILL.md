---
name: deep-interview
description: Socratic requirements clarification — use before planning complex or vague features to expose hidden assumptions and failure modes.
---

# Deep Interview

Conduct a structured requirements interview using Socratic questioning before any planning or implementation begins.

## When To Use

- Vague or open-ended feature requests
- Complex tasks touching multiple systems
- When the user says "I want something like..." or "make it better"
- Before any project that will take more than a few hours

## Process

1. **Restate** the request to confirm understanding
2. **Question** — ask 3-5 critical questions ranked by impact on outcome:
   - What does success look like? (acceptance criteria)
   - What must NOT change? (guardrails)
   - Who uses this and how? (user context)
   - What's the simplest version that delivers value? (MVP scope)
   - What has been tried before? (prior art)
3. **Analyze** responses for:
   - Contradictions between stated goals
   - Implicit assumptions that need validation
   - Scope that's larger than the user realizes
4. **Summarize** as a structured requirements document:
   - Goal (one sentence)
   - Requirements (numbered, verifiable)
   - Non-requirements (explicitly out of scope)
   - Risks and mitigations
   - Verdict: CLEAR TO PLAN or NEEDS MORE CLARIFICATION

## Output

Hand off the requirements document to `planner` for plan generation, or use the `deep-interview-then-build` chain for end-to-end execution.
