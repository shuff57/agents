---
name: hermes-chain
description: Use when you need agents to run sequentially, each passing output to the next. Covers all 8 chains, when to pick each one, how to invoke them, and how to build custom sequences.
triggers:
  - chain
  - sequential agents
  - agent pipeline
  - run agents in sequence
  - which chain
  - chain plan-build
  - chain ultrawork
  - chain full-review
  - chain scout-flow
---

# Hermes Agent Chains

Chains run agents SEQUENTIALLY — each agent receives the previous agent's output.
Use a chain when the task has a natural handoff structure.
Use a team when you want agents running in parallel. (See hermes-team skill.)

Source of truth: /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/roster/agent-chain.yaml

---

## Invocation syntax

In Claude Code or OpenCode:
  @chain:<name>  <your prompt>

Examples:
  @chain:plan-build  add rate limiting to the API endpoints
  @chain:ultrawork   migrate the database layer from raw SQL to Drizzle ORM
  @chain:full-review  implement user profile editing

The initial prompt becomes $INPUT for the first agent. Each subsequent agent
receives the prior agent's output as $INPUT, with the original request preserved
as $ORIGINAL.

---

## All 8 Chains

### plan-build
Steps: planner -> code-engineer
Speed: Fast (2 steps)
Use when: Task is reasonably clear, you trust the planner's output, and want
to skip review overhead. Best for small-to-medium well-defined work.
Example: "Add input validation to the user registration form."

### scout-flow
Steps: scout -> scout -> scout
Speed: Fast (3 steps, same agent)
Use when: Deep codebase recon where you want triple validation. First scout
maps the terrain, second validates and cross-checks, third does a final
accuracy pass. Use before any major refactor or when exploring unfamiliar code.
Example: "Map all the places where database connections are opened and closed."

### plan-review-plan
Steps: planner -> critic -> planner
Speed: Medium (3 steps)
Use when: You want an iterative plan — draft, critique, revise. Good for
complex tasks where the first plan is likely to have gaps.
Example: "Plan the migration from class components to hooks."

### full-review
Steps: scout -> planner -> code-engineer -> critic
Speed: Medium (4 steps)
Use when: Standard implementation cycle. Scout finds context, planner
creates a strategy, code-engineer builds it, critic verifies. The default
chain for most coding tasks of moderate complexity.
Example: "Add a retry mechanism to the job queue processor."

### research-plan-build
Steps: librarian -> planner -> prometheus -> critic
Speed: Medium (4 steps)
Use when: The task depends on external libraries, APIs, or documentation
you don't have in the codebase. librarian fetches the needed knowledge first,
then the rest proceeds.
Example: "Integrate Stripe webhook handling using their latest SDK."

### oracle-then-build
Steps: oracle -> prometheus -> critic
Speed: Medium (3 steps)
Use when: The task has real architectural complexity or tradeoffs that need
deep reasoning before touching code. oracle advises, prometheus executes,
critic verifies.
Example: "Design and implement the caching layer for the search results API."

### ultrawork
Steps: scout -> planner -> critic -> prometheus -> critic
Speed: Slow (5 steps)
Use when: Maximum quality for high-stakes or complex tasks. The most
thorough chain — explore, plan, challenge the plan, implement, verify.
Use for migrations, large refactors, or anything where failure is costly.
Example: "Migrate the entire auth system from JWT to session-based auth."

### deep-interview-then-build
Steps: metis -> planner -> critic -> prometheus -> critic
Speed: Slow (5 steps)
Use when: The request is vague, ambiguous, or has hidden complexity.
metis conducts Socratic questioning to surface assumptions before planning
begins. Best when you're not fully sure what you want.
Example: "Improve the onboarding flow" (ambiguous — metis will clarify first)

---

## Choosing the right chain

Situation                                     | Chain
---                                           | ---
Clear task, fast path                         | plan-build
Deep codebase exploration, triple-validated   | scout-flow
Complex plan that needs iteration             | plan-review-plan
Standard implementation with context          | full-review
Task needs external lib/API knowledge first   | research-plan-build
Architectural complexity before building      | oracle-then-build
High-stakes or complex, maximum quality       | ultrawork
Vague or ambiguous request                    | deep-interview-then-build

---

## Chain vs Team decision

  Use a CHAIN when:
  - Output of one agent must feed the next
  - The task has a natural phase structure (research -> plan -> build -> verify)
  - You want accumulated context to build up through the pipeline

  Use a TEAM when:
  - You want multiple independent perspectives simultaneously
  - Agents don't need each other's output
  - Speed matters and the work can be parallelized

---

## Building a custom chain (manual sequential invocation)

Chains are fixed in agent-chain.yaml. For a custom sequence, either:

1. Run agents manually one after another, copying output as context:
     @planner    plan this: [task]
     @prometheus  implement this plan: [paste planner output]
     @critic      verify: [paste prometheus output]

2. Ask atlas to orchestrate a custom sequence:
     @atlas  run metis then oracle then code-engineer sequentially on: [task]

---

## How $INPUT and $ORIGINAL work

Each chain step uses two variables:
  $INPUT    — the output from the previous step (or the user's initial prompt for step 1)
  $ORIGINAL — the user's original prompt, preserved throughout the chain

Example from full-review chain:
  Step 1 (scout):       "Explore the codebase and identify: $INPUT"
  Step 2 (planner):     "Based on this analysis, create a plan: $INPUT"
  Step 3 (code-engineer): "Implement this plan: $INPUT"
  Step 4 (critic):      "Review this implementation: $INPUT"

---

## Adding or editing chains

Edit: /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/roster/agent-chain.yaml
Then run: bash /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/sync.sh

Format:
  chain-name:
    description: "What this chain does"
    steps:
      - agent: agent-name
        prompt: "Instruction for this agent. Use $INPUT for prior output, $ORIGINAL for initial prompt."
      - agent: next-agent
        prompt: "..."

---

## Pitfalls

- Chains are sequential — each step waits for the previous to finish.
  For parallel work, use a team.
- $INPUT at step 1 is the user's original prompt. Design step 1 prompts accordingly.
- Long chains accumulate context — later agents see more but prompts can get large.
  ultrawork and deep-interview-then-build are expensive; use them deliberately.
- plan-build skips the critic gate — if quality matters, use full-review instead.
- deep-interview-then-build requires the user to RESPOND to metis's questions before
  the chain continues. Don't use it in fully autonomous/unattended workflows.
- @chain syntax works in Claude Code and OpenCode. In Hermes, manually sequence
  agents with delegate_task or pass output between tool calls.
