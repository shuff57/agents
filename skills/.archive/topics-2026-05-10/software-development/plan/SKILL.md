---
name: plan
description: "Plan mode: write markdown implementation plan to .hermes/plans/, no exec. Covers both the plan-mode workflow (inspect-only, no mutations) and the writing-plans methodology (bite-sized tasks, exact file paths, complete code, TDD cycle, verification steps). Use before implementing multi-step features, delegating to subagents, or when user says 'plan this', 'write a plan', '/plan'."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [planning, plan-mode, implementation, workflow]
    related_skills: [writing-plans, subagent-driven-development]
---

# Plan Mode

Use this skill when the user wants a plan instead of execution.

## Core behavior

For this turn, you are planning only.

- Do not implement code.
- Do not edit project files except the plan markdown file.
- Do not run mutating terminal commands, commit, push, or perform external actions.
- You may inspect the repo or other context with read-only commands/tools when needed.
- Your deliverable is a markdown plan saved inside the active workspace under `.hermes/plans/`.

## Output requirements

Write a markdown plan that is concrete and actionable.

Include, when relevant:
- Goal
- Current context / assumptions
- Proposed approach
- Step-by-step plan
- Files likely to change
- Tests / validation
- Risks, tradeoffs, and open questions

If the task is code-related, include exact file paths, likely test targets, and verification steps.

## Save location

Save the plan with `write_file` under:
- `.hermes/plans/YYYY-MM-DD_HHMMSS-<slug>.md`

Treat that as relative to the active working directory / backend workspace. Hermes file tools are backend-aware, so using this relative path keeps the plan with the workspace on local, docker, ssh, modal, and daytona backends.

If the runtime provides a specific target path, use that exact path.
If not, create a sensible timestamped filename yourself under `.hermes/plans/`.

## Interaction style

- If the request is clear enough, write the plan directly.
- If no explicit instruction accompanies `/plan`, infer the task from the current conversation context.
- If it is genuinely underspecified, ask a brief clarifying question instead of guessing.
- After saving the plan, reply briefly with what you planned and the saved path.

---

## Writing Plans Methodology (from writing-plans)

Write comprehensive implementation plans assuming the implementer has zero context. Document everything: which files to touch, complete code, testing commands, verification steps. Give them bite-sized tasks (2-5 min each). DRY. YAGNI. TDD. Frequent commits.

**Core principle:** A good plan makes implementation obvious. If someone has to guess, the plan is incomplete.

### Task Granularity

**Each task = 2-5 minutes of focused work.** Every step is one action: write failing test, run it, implement, run tests, commit.

**Bad:** "Task 1: Build authentication system" [50 lines across 5 files]
**Good:** "Task 1: Create User model with email field" [10 lines, 1 file]

### Plan Document Structure

```markdown
# [Feature Name] Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** [One sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [Key technologies]

### Task N: [Descriptive Name]
**Objective:** [One sentence]
**Files:** Create/Modify/Test exact paths
**Step 1:** Write failing test (include complete code)
**Step 2:** Run test, verify failure
**Step 3:** Write minimal implementation (include complete code)
**Step 4:** Run test, verify pass
**Step 5:** Commit
```

### Writing Process

1. Understand requirements
2. Explore codebase (search_files, read_file)
3. Design approach (architecture, file org, dependencies, testing)
4. Write tasks in order: setup → core (TDD) → edge cases → integration → cleanup
5. Add complete details: exact file paths, complete code, exact commands, expected output
6. Review: tasks sequential, bite-sized, paths exact, copy-pasteable code
7. Save to `.hermes/plans/YYYY-MM-DD_HHMMSS-<slug>.md`

### Execution Handoff

After saving, offer: "Plan complete and saved. Ready to execute using subagent-driven-development — I'll dispatch a fresh subagent per task with two-stage review. Shall I proceed?"

### Remember

Bite-sized tasks | Exact file paths | Complete code | Exact commands | Verification steps | DRY, YAGNI, TDD | Frequent commits
