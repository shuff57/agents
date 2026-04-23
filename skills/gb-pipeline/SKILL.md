---
name: gb-pipeline
description: Use when syncing MyOpenMath assignments and scores into Aeries end-to-end, especially when assignments may be missing, scores may be unsynced, or the user wants one orchestrated compare → create → sync workflow with approval checkpoints between stages.
---

# Gradebook Pipeline

> Orchestrate the full MOM → Aeries gradebook pipeline by delegating Stage 1 to `gb-compare`, Stage 2 to `gb-new-assignment`, and Stage 3 to `gb-sync`. This skill exists for the full workflow only: it preserves the temp-file handoff, verifies every stage result, and stops for explicit user approval before any later stage continues.

## Prerequisites
- Playwriter connected and enabled on the relevant browser tabs
- MyOpenMath gradebook tab open in teacher view
- Aeries gradebook tab open with write access
- Access to the temp workspace used by the gradebook tools (`grade-cloning/temp/`)
- Permission to stop between stages and wait for user confirmation

## When to Use
- User asks to sync MyOpenMath assignments and scores into Aeries end-to-end
- User needs both missing assignments created and scores transferred
- User wants one orchestrated workflow instead of manually running `gb-compare`, `gb-new-assignment`, and `gb-sync`
- User wants to sync just one assignment, but still needs the full compare → confirm → sync safety flow

## When NOT to Use
- Only comparison is needed — use `load_skills=["gb-compare"]`
- Only missing assignments need to be created — use `load_skills=["gb-new-assignment"]`
- Only score sync is needed after assignments already exist — use `load_skills=["gb-sync"]`
- The user wants silent automation without stage-by-stage approval

## Guardrails

> ⚠️ **Must NOT:**
> - Never skip the approval gate between Stage 1 → Stage 2 or Stage 2 → Stage 3.
> - Never skip a pre- or post-stage `AskUserQuestion` hook; each stage is gated by an explicit hook that collects scope, exclusions, sync mode, target, or approval before advancing.
> - Never auto-advance after any stage, even if the result looks clean.
> - Never bypass a halted stage. If auth fails, extraction fails, verification fails, or `pipelineHalted === true`, stop the pipeline and report the halt.
> - Never treat Stage 1 as writable. Stage 1 is read-only comparison only.
> - Never hardcode skill file paths; invoke downstream skills only by name via `load_skills=["gb-compare"]`, `load_skills=["gb-new-assignment"]`, and `load_skills=["gb-sync"]`.
> - Never lose the temp-file chain. Stage 2 must read Stage 1's compare JSON, and Stage 3 must continue from the same gradebook-specific temp data.
> - Never declare full success for single-assignment mode. Report it as partial verification only.
> - Never overwrite the source-of-truth rule. MOM remains the source of truth for score sync, and Stage 3 must begin with a dry run.

## Quick Start
Each stage is bracketed by an explicit pre-hook (gather info before running) and post-hook (confirm results before advancing). Every hook is an `AskUserQuestion` call; never infer user intent.
1. **Pre-Stage-1 hook** — confirm tabs are open, approve begin.
2. **Stage 1** — run `load_skills=["gb-compare"]`.
3. **Post-Stage-1 hook** — summarize missing list; ask proceed / skip Stage 2 / stop.
4. **Pre-Stage-2 hook** — ask for any assignment exclusions from the missing list.
5. **Stage 2** — run `load_skills=["gb-new-assignment"]` against the filtered subset.
6. **Post-Stage-2 hook** — summarize created/failed; ask proceed / retry / stop.
7. **Pre-Stage-3 hook** — ask sync mode (full vs single) and target assignment if single.
8. **Stage 3** — run `load_skills=["gb-sync"]`; dry run first, apply on confirmation.
9. **Post-Stage-3 hook** — verify halt + per-student status; on halt or failure ask stop / retry.

## Workflow

Each stage is wrapped in two hooks that call `AskUserQuestion` — a pre-hook that gathers info *before* the stage runs, and a post-hook that confirms results and routes the next step. Never skip a hook. Never infer answers.

### Phase 1: Pre-Stage-1 Hook
- **INPUT:** User intent to run the pipeline
- **ACTION:** Call `AskUserQuestion` with one question:
  - `question`: "Pre-flight check: are both MOM and Aeries gradebook tabs open and ready for Stage 1 compare?"
  - `header`: "Pre-S1"
  - `multiSelect`: false
  - `options`:
    - `label`: "Both tabs open; begin Stage 1" · `description`: "Recommended. Proceed to spawn gb-compare."
    - `label`: "Cancel — tabs not ready" · `description`: "Stop pipeline so I can open the required tabs."
- If the user picks "Cancel" (or uses Other to decline), stop cleanly without spawning Stage 1.
- **OUTPUT:** Explicit go-ahead to run Stage 1.

### Phase 2: Stage 1 Compare
- **INPUT:** Open MOM and Aeries gradebook tabs
- **ACTION:** Spawn Stage 1 with the compare skill.

```python
task(
  category="unspecified-high",
  load_skills=["gb-compare"],
  run_in_background=False,
  description="Stage 1: Compare MOM vs Aeries assignments",
  prompt="Pipeline-orchestrated run: skip the standalone pre/post hooks — the gb-pipeline orchestrator handles them. Run gb-compare. Both tabs are already open: MyOpenMath gradebook and Aeries gradebook. Compare all assignments, expand all MOM categories, collect assigned/due dates, generate the markdown comparison report, and write the structured temp file at grade-cloning/temp/gb_compare_{gradebookNum}.json where gradebookNum is extracted from the Aeries URL."
)
```

- **OUTPUT:** Stage 1 writes `grade-cloning/temp/gb_compare_{gradebookNum}.json` and the comparison report.

### Phase 3: Post-Stage-1 Hook
- **INPUT:** `grade-cloning/temp/gb_compare_{gradebookNum}.json`
- **ACTION:**
  - Read the compare JSON; extract `gradebookNum`, `missing`, and `matched`.
  - Summarize total MOM, total Aeries, missing count, matched count.
  - Show the missing assignments table: name, category, points, assigned date, due date.
  - Call `AskUserQuestion`. Shape depends on `missing.length`:
    - If `missing.length === 0`:
      - `question`: "No assignments are missing from Aeries. What next?"
      - `header`: "Post-S1"
      - `multiSelect`: false
      - `options`:
        - `label`: "Skip Stage 2, go to Stage 3" · `description`: "Recommended. Nothing to create; proceed to score sync."
        - `label`: "Stop pipeline" · `description`: "Exit cleanly after compare."
    - If `missing.length > 0`:
      - `question`: "{N} assignments are missing from Aeries. What next?"
      - `header`: "Post-S1"
      - `multiSelect`: false
      - `options`:
        - `label`: "Proceed to Stage 2" · `description`: "Recommended. Create the missing assignments in Aeries."
        - `label`: "Skip Stage 2, go to Stage 3" · `description`: "Leave Aeries as-is; sync only scores for matched assignments."
        - `label`: "Stop pipeline" · `description`: "Exit cleanly after compare."
  - Route on the selection: stop → exit; skip → jump to Phase 7; proceed → continue to Phase 4.
- **OUTPUT:** Explicit routing decision.

### Phase 4: Pre-Stage-2 Hook
- **INPUT:** Approved proceed-to-create + full missing list from Stage 1
- **ACTION:** Call `AskUserQuestion`:
  - `question`: "Any assignments to exclude from creation?"
  - `header`: "Pre-S2"
  - `multiSelect`: false
  - `options`:
    - `label`: "Create all {N} missing" · `description`: "Recommended. Pass the full missing list to gb-new-assignment."
    - `label`: "Exclude some — I'll list them" · `description`: "You'll type assignment names/numbers to skip via Other."
- If the user picks "Exclude some", parse the Other free-text input into an exclusion list (by exact assignment name). Compute `missingToCreate = missing.filter(a => !excluded.includes(a.name))`.
- If the resulting subset is empty, stop cleanly and report that no assignments will be created.
- **OUTPUT:** Final missing subset + optional exclusion list for the Stage 2 prompt.

### Phase 5: Stage 2 Add Missing Assignments
- **INPUT:** Approved missing subset, `gradebookNum`, and any exclusions
- **ACTION:** Spawn Stage 2. If there are exclusions, include them in the prompt so gb-new-assignment skips them; otherwise omit the exclusion line entirely.

```python
task(
  category="unspecified-high",
  load_skills=["gb-new-assignment"],
  run_in_background=False,
  description="Stage 2: Add missing assignments to Aeries",
  prompt="Pipeline-orchestrated run: skip the standalone pre/post hooks — the gb-pipeline orchestrator handles them. Run gb-new-assignment. The Aeries gradebook tab is already open. Read the Stage 1 temp file at grade-cloning/temp/gb_compare_{gradebookNum}.json to get the missing assignments list. {EXCLUSION_LINE} Add all remaining missing assignments to Aeries, verify the results, and write the completion temp file at grade-cloning/temp/gb_new_assignment_{gradebookNum}.json."
)
```

- Replace `{EXCLUSION_LINE}` with `"Skip the following excluded assignments: [name1, name2, ...]."` when exclusions exist, or drop the placeholder entirely when there are none.
- **OUTPUT:** Stage 2 writes `grade-cloning/temp/gb_new_assignment_{gradebookNum}.json`.

### Phase 6: Post-Stage-2 Hook
- **INPUT:** `grade-cloning/temp/gb_new_assignment_{gradebookNum}.json`
- **ACTION:**
  - Read the Stage 2 temp file; show created count `K`, skipped count `S`, failed count `F`.
  - Call `AskUserQuestion`. Shape depends on `F`:
    - If `F === 0`:
      - `question`: "Added {K}/{N} assignment(s). Proceed to Stage 3 score sync?"
      - `header`: "Post-S2"
      - `multiSelect`: false
      - `options`:
        - `label`: "Proceed to Stage 3" · `description`: "Recommended. Move into score sync."
        - `label`: "Stop pipeline" · `description`: "Exit cleanly after creation."
    - If `F > 0`:
      - `question`: "Added {K}/{N}; {F} failed. What next?"
      - `header`: "Post-S2"
      - `multiSelect`: false
      - `options`:
        - `label`: "Proceed to Stage 3 anyway" · `description`: "Recommended. Sync scores for what was created."
        - `label`: "Retry Stage 2 for failures" · `description`: "Re-enter Phase 5 for the failed subset."
        - `label`: "Stop pipeline" · `description`: "Exit cleanly; fix failures manually."
  - Route: stop → exit; retry → re-enter Phase 5; proceed → continue to Phase 7.
- **OUTPUT:** Routing decision.

### Phase 7: Pre-Stage-3 Hook
- **INPUT:** Approved proceed-to-sync + compare JSON
- **ACTION:**
  - Call `AskUserQuestion` (mode):
    - `question`: "Stage 3 sync mode?"
    - `header`: "Pre-S3"
    - `multiSelect`: false
    - `options`:
      - `label`: "Full sync — all MOM assignments" · `description`: "Recommended. Sync every assignment covered by the compare scope."
      - `label`: "Single-assignment sync" · `description`: "Only sync scores for one target assignment."
  - If the user picks "Single-assignment sync", make a follow-up `AskUserQuestion` (target):
    - `question`: "Which target assignment should Stage 3 sync?"
    - `header`: "Target"
    - `multiSelect`: false
    - `options`: up to 4 assignment names pulled from the compare JSON `matched` list, ordered by most recent due date. The user can use Other to type a name not shown.
  - Record `syncMode` ∈ {`full`, `single`} and, if single, `targetAssignment`.
- **OUTPUT:** Sync mode (+ optional target).

### Phase 8: Stage 3 Sync Scores
- **INPUT:** `syncMode`, `gradebookNum`, Stage 1 compare JSON, optional `targetAssignment`
- **ACTION:** Preserve the temp-file chain — read `gb_compare_{gradebookNum}.json` for scope, reuse `gb_sync_{gradebookNum}.json` for cache, allow per-student files under `grade-cloning/temp/students/{gradebookNum}/`. Always start with a dry run before any writeback.

If `syncMode === "full"`:

```python
task(
  category="unspecified-high",
  load_skills=["gb-sync"],
  run_in_background=False,
  description="Stage 3: Sync MOM scores to Aeries",
  prompt="Pipeline-orchestrated run: skip the standalone pre/post hooks — the gb-pipeline orchestrator handles them. Run gb-sync Phases 1-7. Both tabs are already open: MyOpenMath gradebook and Aeries gradebook. Read grade-cloning/temp/gb_compare_{gradebookNum}.json for the pipeline scope, then use the temp cache at grade-cloning/temp/gb_sync_{gradebookNum}.json to reuse fresh extraction work when possible. Always start with dryRun: true, show the dry-run output to the user, and wait for confirmation before applying with dryRun: false. Phase 4.6 writes per-student JSON files in grade-cloning/temp/students/{gradebookNum}/. Resume from syncProgress.completedStudents if interrupted. Final acceptance criterion: 0 mismatches and 0 missing after verification."
)
```

If `syncMode === "single"`:

```python
task(
  category="unspecified-high",
  load_skills=["gb-sync"],
  run_in_background=False,
  description="Stage 3: Sync single assignment scores to Aeries",
  prompt="Pipeline-orchestrated run: skip the standalone pre/post hooks — the gb-pipeline orchestrator handles them. Run gb-sync Phases 1-7 in SINGLE-ASSIGNMENT MODE. Target assignment: {TARGET_ASSIGNMENT}. Both tabs are already open. Read grade-cloning/temp/gb_compare_{gradebookNum}.json for the pipeline scope, set targetAssignment = \"{TARGET_ASSIGNMENT}\" during target resolution, and use grade-cloning/temp/gb_sync_{gradebookNum}.json for cache/progress. Always start with dryRun: true, show the dry-run output to the user, and wait for confirmation before applying with dryRun: false. Only process the resolved target assignment in Phases 5-7. Student files may end in partial-verified rather than verified."
)
```

- **OUTPUT:** Stage 3 writes/updates `grade-cloning/temp/gb_sync_{gradebookNum}.json` plus per-student status files.

### Phase 9: Post-Stage-3 Hook
- **INPUT:** `grade-cloning/temp/gb_sync_{gradebookNum}.json` and `grade-cloning/temp/students/{gradebookNum}/*.json`
- **ACTION:**
  - Read the main sync cache; check `pipelineHalted`.
  - **Branch A — halted (`pipelineHalted === true`):**
    - Report `haltReason`, `haltStudents`, `haltAssignments`.
    - Call `AskUserQuestion`:
      - `question`: "Pipeline halted: {haltReason}. What next?"
      - `header`: "Post-S3"
      - `multiSelect`: false
      - `options`:
        - `label`: "Stop and let me review" · `description`: "Recommended. Exit and let the user investigate."
        - `label`: "Retry Stage 3 from saved progress" · `description`: "Re-enter Phase 8; gb-sync resumes from syncProgress.completedStudents."
    - Route: stop → exit with halt details; retry → re-enter Phase 8.
  - **Branch B — not halted:**
    - Read every per-student file; count statuses.
    - If any file is `verify-failed`, `error`, `filled`, or `pending`:
      - Call `AskUserQuestion`:
        - `question`: "{X} student files show failures or pending state. What next?"
        - `header`: "Post-S3"
        - `multiSelect`: false
        - `options`:
          - `label`: "Stop and let me review" · `description`: "Recommended. List affected students and exit."
          - `label`: "Retry verification from saved progress" · `description`: "Re-enter Phase 8; gb-sync picks up from the saved cache."
      - Route: stop → list affected students and exit; retry → re-enter Phase 8.
    - If `syncMode === "single"` and all student files are `partial-verified`: report partial single-assignment completion only. Do not call this full pipeline success.
    - If `syncMode === "full"` and all student files are `verified`: report verified full pipeline completion.
- **OUTPUT:** One terminal state — halted, partial, or verified — or a re-entry to Phase 8.

## State Management

### Temp File Chain

| File | Written by | Read by | Purpose |
|------|------------|---------|---------|
| `grade-cloning/temp/gb_compare_{gradebookNum}.json` | Stage 1 (`gb-compare`) | Orchestrator, Stage 2, Stage 3 | Canonical compare result and pipeline scope |
| `grade-cloning/temp/gb_new_assignment_{gradebookNum}.json` | Stage 2 (`gb-new-assignment`) | Orchestrator | Assignment-creation completion record |
| `grade-cloning/temp/gb_sync_{gradebookNum}.json` | Stage 3 (`gb-sync`) | Orchestrator, Stage 3 reruns | Sync cache, progress, halt state |
| `grade-cloning/temp/students/{gradebookNum}/*.json` | Stage 3 verification phases | Orchestrator, Stage 3 reruns | Per-student verification status |

### Resume Rules
- Extract `gradebookNum` from the Aeries URL and reuse it consistently across all stages.
- Treat `gb_compare_{gradebookNum}.json` as the source file for downstream pipeline scope.
- If Stage 3 times out or is interrupted, rerun Stage 3 against the same `gb_sync_{gradebookNum}.json` so it can resume from saved progress.

## Error Handling

| Problem | Action |
|---------|--------|
| Stage 1 temp file missing | Stop. Report that `gb-compare` did not finish correctly and rerun Stage 1. |
| Stage 2 reads an empty or stale missing list | Stop and rerun Stage 1 so Stage 2 gets a fresh compare JSON. |
| Stage 2 reports partial failures | Show the failed assignments, stop, and let the user decide whether to rerun Stage 2. |
| Stage 3 times out mid-run | Rerun Stage 3 against the same `gb_sync_{gradebookNum}.json`; resume from saved progress instead of starting over. |
| `pipelineHalted === true` in Stage 3 cache | Stop immediately, print halt details, and do not report completion. |
| Student files contain `verify-failed`, `error`, `filled`, or `pending` | Treat the pipeline as incomplete, list the affected students, and stop for review. |
| Single-assignment mode ends with `partial-verified` files | Report partial completion only and tell the user to run a full sync for complete verification. |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running this skill when only one stage is needed | Invoke the specific downstream skill directly instead of the pipeline orchestrator. |
| Advancing to the next stage without user confirmation | Stop after each stage, summarize results, and call `AskUserQuestion` in the post-hook before advancing. |
| Starting a stage without running its pre-hook | Every stage begins with an `AskUserQuestion` pre-hook that collects tabs-ready, exclusions, sync mode, or target before spawning. |
| Hardcoding downstream skill file paths | Use `load_skills=["gb-compare"]`, `load_skills=["gb-new-assignment"]`, and `load_skills=["gb-sync"]` only. |
| Treating single-assignment sync as full verification | Report `partial-verified` as partial completion and recommend a later full sync. |
| Declaring success from the main Stage 3 cache alone | Also read every per-student file and require `verified` for full-sync success. |
| Ignoring the Stage 1 compare JSON during later stages | Preserve the temp-file chain and pass the compare JSON forward as the canonical pipeline scope. |
