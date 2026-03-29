# {{PROJECT_NAME}} Project Brain (Layer 1 Routing)

This file is the high-level routing brain for the 3-layer agent architecture. It tells agents what this project is, which capability family to route to, and which boundaries must be respected.

## Project Identity

{{PROJECT_NAME}} — {{PROJECT_DESCRIPTION}}.

Primary stack and runtime surfaces:
{{TECH_STACK}}

Key directories agents should recognize:
- `.agents/skills/` — project skills (authoritative skill location)
- `.agents/commands/` — canonical command content (tool-agnostic, authoritative)
- `.agents/cli/` — CLI tool references (lazy-load only — read what you need)
- Tool-specific bridges point here as thin pointers
- `.agents/memory/` — cross-session learnings and reflections

Routing intent:
- Use this file for capability-level decisions only
- Delegate tactical steps to skills and command documents
- Keep execution aligned with project outcomes

## Skill Routing Guide

Use skill names for routing decisions. Do not embed full workflow details here.

### Meta and Utility
- `skill-creator`: create or refactor skills in project-standard format.
- `session-reflector`: capture end-of-session learnings for later cross-session reuse.
- `find-skills`: discover additional community or installable skills when no existing skill fits.

### Project Skills
<!-- Add project-specific skill routing entries here as skills are created -->

Routing preference rules:
- Prefer the most specific skill over generic instructions.
- If multiple skills apply, start with orchestrator skills for multi-stage jobs.
- Use name-based skill references in prompts and plans; avoid brittle path-specific coupling.

## Conventions

Authoritative conventions for Layer 1 routing:
- Skills live in `.agents/skills/`.
- Canonical commands live in `.agents/commands/`.
- Tool-specific command bridges are thin pointers only — never authoritative content.
- Never hardcode tool-specific skill paths; always use skill names.

Documentation and invocation conventions:
- Use skill names (for example: `session-reflector`, `skill-creator`) rather than hardcoded file paths.
- Keep this file high-level; implementation details belong in skill docs.
- Skills should follow the project gold-standard structure and safety-first ordering.
- Keep guardrails explicit and visible before procedural steps in skill content.
- Preserve routing stability: prefer capability families over one-off ad hoc instructions.

Path and portability discipline:
- Do not hardcode machine-specific absolute paths in routing guidance.
- Keep references portable across local environments.
- Treat this file as policy and intent, not execution script content.

## Learning Protocol

Pattern suggestion directive (required behavior):
- When you notice you're performing a task that doesn't match any existing skill, and you've done it before, suggest exactly:
  - "I noticed I keep doing X. Want me to create a skill? Proposed name: Y, triggers: Z."

Session memory protocol:
- At session start, check `.agents/memory/pending/` for unreviewed reflections.
- Before significant work, run `query_memory.py` for relevant prior learnings.
- At session end, use `session-reflector` to record new insights into `.agents/memory/pending/`.
- Memory writes always require explicit user confirmation [y/n] — never auto-write.

Learning quality rules:
- Capture reusable patterns, not one-off noise.
- Prefer concise, trigger-oriented learnings that improve future routing.
- Promote repeated successful patterns into formal skills via `skill-creator`.
- If a new repeatable workflow appears, suggest skill creation before it becomes tribal knowledge.

## Scope Boundaries

Agent ownership limits:
- Agents own markdown-based operational infrastructure, routing docs, skills, commands, memory notes, and evidence artifacts.
- Source code changes are out of scope unless the user explicitly requests them.

Hard boundary:
- Never autonomously modify source files without explicit user instruction.
- Treat code edits as opt-in actions requiring explicit user instruction.
- Keep autonomous updates constrained to agent-operational documentation layers.
