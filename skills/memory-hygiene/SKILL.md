---
name: memory-hygiene
description: >
  Use when memory is getting full, stale, or bloated — or proactively at the
  end of any session where significant context was accumulated. Keeps always-on
  memory lean and fast by offloading rich detail to fact_store (on-demand recall)
  and session_search (outcome recall). Triggers: "memory is full", "clean up memory",
  "keep memory light", "memory hygiene", "prune memory", "memory is getting big".
tags: memory, hygiene, fact_store, context-management
---

# Memory Hygiene

## The Two-Tier Strategy

Memory is injected into EVERY turn — bloat costs tokens and buries signal.
The fix: keep memory as pointers, offload detail to fact_store.

  TIER 1 — memory (always-on, ~150 chars per entry max)
    What belongs: root paths, environment footguns, active project pointers,
    recurring corrections, default model/tool, symlink locations.
    Rule: if I can re-discover it in one terminal command, it does NOT belong here.

  TIER 2 — fact_store (on-demand, unlimited)
    What belongs: directory maps, agent rosters, graph stats, file lists,
    provider catalogs, API details, any rich context > 150 chars.
    Pulled only when actually needed via fact_store(action='probe', entity='X').

  TIER 3 — session_search (outcome recall)
    What belongs: what we did, decisions made, bugs fixed, features built.
    NEVER save session outcomes or task progress to memory.

## Step-by-Step Prune Pass

1. Read current memory — note total usage and each entry.

2. For each entry ask: "Would losing this cause me to re-ask the user something
   they've already told me?" If NO → candidate for pruning or moving.

3. Classify each entry:
     KEEP in memory   — footguns, root paths, corrections, active project pointer
     MOVE to fact_store — rich detail, lists, counts, catalog info, file trees
     DELETE entirely  — re-discoverable in <5s with a terminal command

4. For entries to MOVE:
     fact_store(action='add', category='project'|'tool'|'general', content=<full detail>, tags=<keywords>)
     Then replace memory entry with a 1-line pointer:
       "Full detail in fact_store id N" or "see fact_store: <entity>"

5. For entries to SHRINK — replace verbose content with compressed version.
   Target: each memory entry under 150 chars.

6. Verify final usage is under 50% of capacity. Leave headroom for the session.

## Pointer Pattern (memory entry template)

  <project>: <root-path>. <one-line identity>. <one critical footgun if any>.
  Full detail in fact_store ids N-M.

Example:
  agent-evo: /mnt/c/.../agent-evo. Skills in skills/ (88 dirs), symlinked everywhere.
  Full map+roster in fact_store ids 1-3.

## Ongoing Rules

1. One correction = one memory entry. Max 150 chars.
2. After each session, ask: did any memory entry get referenced? If not, consider removing it.
3. Never save task progress, session outcomes, or completed-work logs to memory.
4. Prefer pointers over content: "see graphify-out/GRAPH_REPORT.md" beats copying stats.
5. Use session_search for "what did we do on X" — it's free and unlimited.
6. When memory hits 70%+, run a prune pass before adding more.

## fact_store Retrieval Patterns

  probe entity     → fact_store(action='probe', entity='bookSHelf')
  keyword search   → fact_store(action='search', query='roster agents')
  multi-entity     → fact_store(action='reason', entities=['agent-evo', 'bookSHelf'])
  rate after use   → fact_feedback(action='helpful'|'unhelpful', fact_id=N)

## Pitfalls

- Memory replace fails if new content is longer than the space freed — shrink
  another entry first or split into multiple smaller entries.
- fact_store probe returns ALL facts tagged to an entity — use specific tags
  to keep results tight.
- Don't create a fact_store entry for something that changes every session
  (e.g., current git branch, last run output) — those belong in session_search.
