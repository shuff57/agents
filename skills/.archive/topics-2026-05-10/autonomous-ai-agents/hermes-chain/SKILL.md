---
name: hermes-agent-orchestration
description: "Use when orchestrating multiple AI agents — sequential chains (each passing output to the next), parallel teams (same prompt, independent responses), or coordinated native teams (shared task list, mailbox). Covers all 8 chains, 11 teams, when to pick each, how to invoke them, plus the cc-team variant for coordinated Claude Code teammates."
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

In Claude Code:
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
- @chain syntax works in Claude Code. In Hermes, manually sequence
  agents with delegate_task or pass output between tool calls.

---

## Parallel Teams (from hermes-team)

Teams run multiple agents IN PARALLEL on the same prompt.
Use a team when you want simultaneous perspectives or parallel coverage.
Use a chain when you need sequential handoff (see above).
If you need teammates that TALK TO EACH OTHER and share a task list,
use the cc-team variant below.

Source of truth: /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/roster/teams.yaml

### Team Invocation

In Claude Code:
  @team:<name>  <your prompt>

Each agent in the team receives the same prompt and responds independently.
Results come back as separate agent outputs — no synthesis step.

### All 11 Teams

| Team | Agents | Use when |
|------|--------|----------|
| full | scout, planner, code-engineer, critic, documenter, red-team | Complete lifecycle coverage for a non-trivial feature |
| info | scout, documenter, critic | Gather, summarize, and validate information |
| frontend | planner, code-engineer, bowser | Frontend with plan + implementation + browser verify |
| experts | meta-orchestrator + 9 domain experts | Building platform components |
| omo | oracle, librarian, scout, critic | Deep research — internal + external knowledge + reasoning |
| advisory | oracle, metis, critic | Architecture decisions / design reviews (read-only) |
| implementation | code-engineer, prometheus, atlas | Clear spec, maximum parallel implementation throughput |
| planning | scout, planner, critic | Create a work plan with recon + draft + review |
| quality | qa-tester, critic, red-team | Post-implementation verification + security audit |
| design | designer, code-engineer, critic | UI/UX with design + code + review |
| debug | debugger, scout, oracle | Root-cause diagnosis + context + reasoning |

### Choosing: Chain vs Team vs cc-team

| Need | Use |
|------|-----|
| Output of one agent must feed the next | Chain (above) |
| Multiple independent perspectives simultaneously | Team |
| Speed matters, work can be parallelized | Team |
| Teammates need to talk to each other | cc-team (below) |
| Shared task list / self-claimed work | cc-team (below) |
| Plan approval gates, lead synthesis | cc-team (below) |

### Custom Teams

Teams are fixed in teams.yaml. For a custom parallel group, invoke agents
individually or ask atlas to coordinate them. Or in Hermes via delegate_task
with tasks=[] (max 3 parallel subagents).

---

## Native Claude Code Teams (from cc-team)

Spawns a real Claude Code agent team (not parallel fan-out). Teammates share
a task list, message each other, and the lead synthesizes results.
Requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 and Claude Code v2.1.32+.

### Invocation
```
/cc-team <team-name> <prompt>
```

### How the lead handles invocation

1. **Look up the team.** Read teams.yaml and find the agents list.
2. **Spawn a native Claude Code team.** Tell Claude Code to create a team with each listed agent as a teammate.
3. **Pass the prompt.** Give each teammate the user's prompt as their spawn-time task. Let the lead coordinate — do not assign all tasks up front.
4. **Synthesize.** Combine findings into a single response.

### Team roster reference

Same 11 teams as above (mirror of teams.yaml). Re-read at invocation time in case it changed.

### Pitfalls

- Only one team per session. Clean up before spawning a new one.
- Lead is fixed. The session that spawns the team is lead for its lifetime.
- No nested teams. Teammates cannot spawn their own teams.
- File conflicts. Split work so teammates don't edit the same file concurrently.
- Token cost scales linearly with team size. The `full` and `experts` teams are expensive.

---

## Adding or editing chains/teams

Edit the respective YAML, then run sync:
  Chains: /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/roster/agent-chain.yaml
  Teams: /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/roster/teams.yaml
  Sync: bash /mnt/c/Users/shuff57/Documents/GitHub/agent-evo/sync.sh
