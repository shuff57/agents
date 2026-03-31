---
name: ultrawork
description: 5-phase autonomous loop — explore, plan, decide, execute, verify. Maximum performance mode.
argument-hint: "<task description>"
---
<objective>
Execute a task using the 5-phase ultrawork pipeline. Each phase uses the optimal agent for the job with model tiering (haiku for exploration, opus for planning/decisions, sonnet for execution).

Phases:
1. EXPLORE — Scout maps the codebase terrain (haiku, fast)
2. PLAN — Planner creates detailed strategy (opus, deep reasoning)
3. DECIDE — Critic reviews plan for gaps and risks (opus, thorough)
4. EXECUTE — Prometheus implements the approved plan (sonnet, balanced)
5. VERIFY — Critic verifies implementation against requirements (opus, thorough)

If DECIDE rejects the plan, loop back to PLAN with feedback (max 2 iterations).
If VERIFY rejects the implementation, loop back to EXECUTE with feedback (max 2 iterations).
</objective>

<context>
Task: $ARGUMENTS
</context>

<process>
## Phase 1: EXPLORE
Spawn the **scout** agent (model: haiku) to map the codebase:
- Find relevant files, patterns, dependencies, and entry points for the task
- Identify existing conventions and potential impacts
- Return structured findings

## Phase 2: PLAN
Spawn the **planner** agent (model: opus) with exploration findings:
- Create a detailed implementation strategy
- Include task breakdown, risk assessment, and acceptance criteria
- Define what "done" looks like

## Phase 3: DECIDE
Spawn the **critic** agent (model: opus) to review the plan:
- Challenge assumptions, find gaps, assess feasibility
- Verdict: APPROVED or REVISE with specific feedback
- If REVISE: return to Phase 2 with feedback (max 2 loops)

## Phase 4: EXECUTE
Spawn the **prometheus** agent (model: sonnet) to implement:
- Follow the approved plan step by step
- Match existing codebase patterns
- Verify each change as you go

## Phase 5: VERIFY
Spawn the **critic** agent (model: opus) for final verification:
- Check every changed file against original requirements
- Verify no stubs, TODOs, or incomplete work
- Verdict: APPROVED or REJECT with specifics
- If REJECT: return to Phase 4 with feedback (max 2 loops)

Report the final verdict and summary of all changes made.
</process>
