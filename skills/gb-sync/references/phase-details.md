# gb-sync Phase Details

Use this reference for the high-detail operational rules that would otherwise make `SKILL.md` too large. The main skill defines the contract; this file preserves the selector-level and resume-level details that make the workflow reliable.

## Session Artifacts

Keep all sync state together so a halted run can resume safely.

| Artifact | Purpose | Notes |
|---------|---------|-------|
| `gb-sync-state-{gradebookNum}.json` | Main session state | Tracks assignment scope, mode, completed batches, halt reason, verification summary |
| `gb-sync-student-{safe-name}.json` | Per-student progress file | One file per matched student; source of truth for resume, dry run, and verification |
| `gb-sync-student-{safe-name}.UNMATCHED.json` | Optional unmatched stub | Use when an Aeries roster entry cannot be matched to MOM with sufficient confidence |
| dry-run report | Human approval artifact | Must be shown before live mode |

Recommended repo-local layout:

```text
.sisyphus/temp/gb-sync/{gradebookNum}/
  gb-sync-state-{gradebookNum}.json
  gb-sync-student-Petersen_Julia_M.json
  gb-sync-student-Smith_John_R.UNMATCHED.json
```

## Matching and Conversion Rules

### Assignment matching
- Read only assignments already confirmed by `gb-compare`, then verify the current live pages still expose them.
- If a single assignment is requested, resolve in this order:
  1. Exact Aeries assignment number
  2. Exact Aeries assignment name
  3. Exact MOM assignment name through the existing cross-map
  4. Fuzzy assignment match as a last resort
- Do not accept a fuzzy assignment match below `0.50` when resolving a single target.

### Student matching
- Normalize to `last, first` pairs.
- Strip punctuation and middle initials because Aeries often includes them while MOM does not.
- Confidence rules:
  - `1.00` exact last + first match
  - `0.95` exact last + first-prefix match
  - `0.90` exact last + first-initial match
  - `0.85` last-name containment + exact first match
- Anything below `0.80` must become manual review, not an automatic sync candidate.

### Score conversion
- MOM stores raw points; Aeries score-entry pages expect a 100-point scale.
- Convert only scored, non-exempt cells:

```javascript
function momToAeries(value, maxPoints) {
  if (value === null || maxPoints === 0) return null;
  return Math.round(value / maxPoints * 100 * 10) / 10;
}
```

- If `momValue` is blank, exempt, `--`, `E`, `-e`, or otherwise unscored, keep the Aeries cell blank.

### Version A / Version B pairs
- If two MOM assignments differ only by a trailing `Version A` / `Version B` marker, treat them as a pair.
- If local grading policy requires it, log the untaken version as `NA` or manual review rather than writing a numeric score.

```javascript
const isVersionA = name => /(?:[\s\-\u2013(]|^)(?:ver?(?:sion)?\s*\.?\s*)?A\s*[)\s]*$/i.test(name.trim());
const isVersionB = name => /(?:[\s\-\u2013(]|^)(?:ver?(?:sion)?\s*\.?\s*)?B\s*[)\s]*$/i.test(name.trim());
const stripVersionSuffix = name => name.replace(/\s*[\-\u2013(]?\s*(?:ver?(?:sion)?\s*\.?\s*)?[AB]\s*[)\s]*$/i, '').trim().toLowerCase();

const aNames = momAssignments.filter(a => isVersionA(a.name) && !isVersionB(a.name)).map(a => a.name);
const bNames = momAssignments.filter(a => isVersionB(a.name) && !isVersionA(a.name)).map(a => a.name);

for (const aName of aNames) {
  const aBase = stripVersionSuffix(aName);
  const bName = bNames.find(b => stripVersionSuffix(b) === aBase);
  if (bName) {
    versionPairs.set(aName, bName);
    versionPairs.set(bName, aName);
  }
}
```

### Strategy note
- `ScoresByAssignment` and `ScoresByStudent` are **Aeries entry strategies**.
- MOM score collection still comes from the MOM gradebook grid; the strategy decision controls how those scores are written into Aeries later.

---

## Selector Quick Reference

### MyOpenMath (MOM)
| Element | Selector / Method | Notes |
|---------|------------------|-------|
| Show filter | `#availshow` | Set `value = '2'` for "All" |
| Expand links | `a` with `[Expand]` text | Click loop until none remain |
| Assignment headers | `th[data-pts]` | One per assignment |
| Assignment name | `th querySelector('div').childNodes[0].textContent.trim()` | First text node ONLY -- excludes `[Settings][Isolate]` |
| Max points | `th.getAttribute('data-pts')` | |
| Category | `.cat1` / `.cat2` / `.cat3` | CSS class on the `<th>` |
| Gradebook table | `#myTable` | Class is `gb`, id is `myTable` |
| Student rows | `#myTable tbody tr` | Skip row 0 (Averages row); name is in `<th>`, not `<td>` |
| Student name | `row.querySelector('th').textContent.trim()` | In `<th>`, NOT first `<td>` |
| Score cell | `[...row.children][th.cellIndex]` | Use ALL children (th+td), not just tds |
| Raw score value | `cell.querySelector('a')?.getAttribute('data-ptv')` | Anchor inside cell; absent = exempt/unscored |
| Exempt marker | No `data-ptv` attr, OR text starts with `-` (e.g. `-e`) | `-e` = exempt, blank anchor = not submitted |

### Aeries
| Element | Selector / Method | Notes |
|---------|------------------|-------|
| Assignment headers | `th[data-an]` | `data-an` = assignment number |
| Assignment name (full) | `th.querySelector('a.assignment-edit')?.getAttribute('data-assignment-name')` | Use this -- `textContent` is truncated with `...` |
| Student rows | `table.students tr.row` | Has `data-sn`, `data-stusc`, `data-stuid` attrs |
| Student name | `tr.row a.student-name-link` | Includes middle initial (e.g. "Smith, John R.") |
| Score grid rows | `table.assignments tr.row` | Aligned 1:1 with students table by `data-sn` |
| Existing score | `tr.row td:first-child` | Empty string = no score entered |
| Score input | `table.assignments input.edit-text` | Dynamically rendered on click -- NOT a static input |
| Score (mk) cell | `td[data-col-name="mk"]` | First editable cell per row; column name disambiguates from np |
| # Possible (np) cell | `td[data-col-name="np"]` | Must always be 100; Aeries auto-sets `np = mk` when overwriting -- fix separately |
| Score entry URL | `/teacher/gradebook/{GN}/S/ScoresByAssignment/Index/{an}` | Path-based, NOT `?an=` query param |
| Save button | `#assignmentQuickAssignSave` | Use `evaluate(() => document.querySelector('#assignmentQuickAssignSave').click())` -- NOT `locator().click()` (causes nav wait -> timeout) |
| Score scale | 0-100 (percent of max) | Convert MOM raw pts: `round(rawPts / maxPts * 100, 1)` |

---

## Phase 1 Code -- Session Setup

```javascript
const pages = context.pages();
const momPage = pages.find(p => p.url().includes('myopenmath.com'));
const aeriesPage = pages.find(p =>
  p.url().includes('aeries') && p.url().toLowerCase().includes('gradebook')
);
if (!momPage) throw new Error('No MyOpenMath tab -- open the MOM gradebook first.');
if (!aeriesPage) throw new Error('No Aeries Gradebook tab -- open Aeries first.');
console.log('MOM:', momPage.url());
console.log('Aeries:', aeriesPage.url());
const gradebookNum = aeriesPage.url().match(/gradebook\/(\d+)/)?.[1];
if (!gradebookNum) throw new Error('Cannot extract gradebook number from Aeries URL');
const aeriesBase = new URL(aeriesPage.url()).origin;
console.log('Gradebook number:', gradebookNum);
```

### Resume / Cache Check
```javascript
const fs = require('fs');
const forceRefresh = false;
const statePath = `C:\\Users\\shuff\\grade-cloning\\temp\\gb_sync_${gradebookNum}.json`;
let cachedState = null;
if (!forceRefresh && fs.existsSync(statePath)) {
  const raw = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const ageHours = (Date.now() - new Date(raw.metadata.extractedAt)) / 36e5;
  if (ageHours < 24 && raw.metadata.gradebookNum === gradebookNum) {
    cachedState = raw;
    console.log(`Loaded cache (${ageHours.toFixed(1)}h old) -- skipping Phases 2-4`);
  }
}
```

### Resume rules
- If a matching state file already exists, load it first.
- Resume only when gradebook number, Aeries base URL, and assignment scope match.
- If stale or mismatched, start fresh only after explicit user approval.
- In single-assignment mode, even during resume, still build full roster and per-student files; only Phases 5-7 are narrowed to the target assignment.

---

## Phase 2 Code -- Extract MOM Scores

### Set Show to All + Expand Categories
```javascript
await momPage.evaluate(() => {
  const sel = document.querySelector('#availshow');
  if (sel) { sel.value = '2'; sel.dispatchEvent(new Event('change')); }
});
await new Promise(r => setTimeout(r, 1500));

while (true) {
  const clicked = await momPage.evaluate(() => {
    const links = [...document.querySelectorAll('a')]
      .filter(a => a.textContent.includes('[Expand]'));
    links.forEach(a => a.click());
    return links.length;
  });
  if (clicked === 0) break;
  await new Promise(r => setTimeout(r, 500));
}
```

### Extract Assignment Map
```javascript
const momAssignments = await momPage.evaluate(() =>
  [...document.querySelectorAll('th[data-pts]')].map(th => {
    const div = th.querySelector('div');
    return {
      columnIndex: th.cellIndex,
      name: div ? div.childNodes[0].textContent.trim() : '',
      maxPoints: parseFloat(th.getAttribute('data-pts')),
      category: ['cat1','cat2','cat3'].find(c => th.classList.contains(c)) || 'unknown'
    };
  })
);
```

### Extract Student Scores
```javascript
const momStudentScores = await momPage.evaluate((assignments) =>
  [...document.querySelectorAll('#myTable tbody tr')].slice(1).map(row => {
    const name = row.querySelector('th')?.textContent.trim();
    if (!name) return null;
    const allCells = [...row.children];
    const scores = {};
    for (const a of assignments) {
      const cell = allCells[a.columnIndex];
      const anchor = cell?.querySelector('a');
      const raw = cell?.textContent.trim() ?? '';
      const ptv = anchor?.getAttribute('data-ptv');
      const isExempt = !ptv || raw === '' || raw === '--' || raw === 'E' || raw.startsWith('-');
      scores[a.name] = {
        raw,
        value: isExempt ? null : parseFloat(ptv),
        isExempt,
        maxPoints: a.maxPoints
      };
    }
    return { name, scores };
  }).filter(Boolean)
, momAssignments);
```

---

## Phase 3 Code -- Extract Aeries Data

```javascript
const aeriesAssignments = await aeriesPage.evaluate(() =>
  [...document.querySelectorAll('th[data-an]')].map(th => ({
    assignmentNumber: th.getAttribute('data-an'),
    name: th.querySelector('a.assignment-edit')?.getAttribute('data-assignment-name')
          ?? th.querySelector('div')?.textContent.trim()
          ?? ''
  }))
);

const aeriesStudents = await aeriesPage.evaluate(() =>
  [...document.querySelectorAll('table.students tr.row')].map(row => ({
    name: row.querySelector('a.student-name-link')?.textContent.trim() ?? '',
    sn: row.getAttribute('data-sn'),
    stusc: row.getAttribute('data-stusc'),
    stuid: row.getAttribute('data-stuid')
  })).filter(s => s.name)
);
```

---

## Phase 4 Code -- Build Cross-System Maps

### Matching Functions
```javascript
function normalize(s) {
  return s.toLowerCase().replace(/--/g, ' ').replace(/[(),&]/g, ' ').replace(/\s+/g, ' ').trim();
}
function extractNumbers(s) { return [...s.matchAll(/\d+\.?\d*/g)].map(m => m[0]); }
function extractWords(s) { return normalize(s).split(' ').filter(w => w.length > 1 && !/^\d/.test(w)); }

function scoreAssignmentMatch(nameA, nameB) {
  const [numsA, numsB] = [extractNumbers(nameA), extractNumbers(nameB)];
  const overlap = numsA.filter(n => numsB.includes(n)).length;
  const numScore = overlap / Math.max(numsA.length, numsB.length, 1);
  if (numScore === 0) return 0;
  const [wordsA, wordsB] = [extractWords(nameA), extractWords(nameB)];
  const wordOverlap = wordsA.filter(w => wordsB.includes(w)).length;
  return numScore * 0.7 + wordOverlap / Math.max(wordsA.length, wordsB.length, 1) * 0.3;
}
```

### Student Name Matching
```javascript
function normalizeStudentName(name) {
  if (!name) return { last: '', first: '' };
  const parts = name.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    const firstName = parts[1].trim().split(/\s+/)[0].toLowerCase().replace(/[^\w]/g, '');
    return { last: parts[0].toLowerCase().replace(/[^\w]/g, ''), first: firstName };
  }
  const words = name.split(/\s+/);
  return { last: words.slice(1).join('').toLowerCase().replace(/[^\w]/g, ''), first: words[0].toLowerCase().replace(/[^\w]/g, '') };
}

function matchStudents(nameA, nameB) {
  const a = normalizeStudentName(nameA);
  const b = normalizeStudentName(nameB);
  if (a.last === b.last && a.first === b.first) return { confidence: 1.0, matched: true };
  if (a.last === b.last && a.first && b.first.startsWith(a.first)) return { confidence: 0.95, matched: true };
  if (a.last === b.last && a.first && b.first[0] === a.first[0]) return { confidence: 0.90, matched: true };
  if ((a.last.includes(b.last) || b.last.includes(a.last)) && a.first === b.first) return { confidence: 0.85, matched: true };
  return { confidence: 0, matched: false };
}
```

### Build Lookup Maps
```javascript
const assignmentCrossMap = {};
const usedMom = new Set();
for (const aeriesA of aeriesAssignments) {
  let best = null, bestScore = 0;
  momAssignments.forEach((momA, i) => {
    if (usedMom.has(i)) return;
    const score = scoreAssignmentMatch(aeriesA.name, momA.name);
    if (score > bestScore) { bestScore = score; best = { idx: i, name: momA.name }; }
  });
  if (best && bestScore >= 0.4) {
    usedMom.add(best.idx);
    assignmentCrossMap[aeriesA.assignmentNumber] = best.name;
  }
}

const aeriesStudentScoreMap = {};
const snToAeriesName = {};
for (const aeriesStudent of aeriesStudents) {
  snToAeriesName[aeriesStudent.sn] = aeriesStudent.name;
  let bestMom = null, bestConf = 0;
  for (const momStudent of momStudentScores) {
    const result = matchStudents(momStudent.name, aeriesStudent.name);
    if (result.matched && result.confidence > bestConf) { bestConf = result.confidence; bestMom = momStudent; }
  }
  if (bestMom && bestConf >= 0.80) {
    const scores = {};
    for (const [aeriesNum, momName] of Object.entries(assignmentCrossMap)) {
      scores[aeriesNum] = bestMom.scores[momName] ?? null;
    }
    aeriesStudentScoreMap[aeriesStudent.name] = scores;
  }
}
```

### Per-Student Temp File Creation
```javascript
const studentsDir = `C:\\Users\\shuff\\grade-cloning\\temp\\students\\${gradebookNum}`;
fs.mkdirSync(studentsDir, { recursive: true });
const perStudentFiles = [];

for (const aeriesStudent of aeriesStudents) {
  const aeriesName = aeriesStudent.name;
  const sn = aeriesStudent.sn;
  const scores = aeriesStudentScoreMap[aeriesName];

  if (!scores) {
    const safeName = aeriesName.replace(/,\s*/g, '_').replace(/\s+/g, '_').replace(/[^\w-]/g, '');
    const warnPath = `${studentsDir}/${safeName}.UNMATCHED.json`;
    fs.writeFileSync(warnPath, JSON.stringify({
      _warning: 'No MOM match found',
      aeriesName, sn
    }, null, 2));
    continue;
  }

  const momScores = {};
  for (const [aeriesNum, scoreData] of Object.entries(scores)) {
    const momName = assignmentCrossMap[aeriesNum];
    momScores[aeriesNum] = {
      momName: momName ?? null,
      value: scoreData.value,
      maxPoints: scoreData.maxPoints,
      isExempt: scoreData.isExempt ?? false,
      aeriesScore: momToAeries(scoreData.value, scoreData.maxPoints)
    };
  }

  const safeName = aeriesName.replace(/,\s*/g, '_').replace(/\s+/g, '_').replace(/[^\w-]/g, '');
  const filePath = `${studentsDir}/${safeName}.json`;

  const studentFile = {
    metadata: { gradebookNum, aeriesBase, studentName: aeriesName, sn, createdAt: new Date().toISOString() },
    momScores,
    diff: { checkedAt: null, readyToEnter: [], skipNonzero: [], skipExempt: [], manualReview: [] },
    result: { status: 'pending', filledAt: null, verifiedAt: null, entriesAttempted: 0, entriesConfirmed: 0, errors: [] }
  };

  fs.writeFileSync(filePath, JSON.stringify(studentFile, null, 2));
  perStudentFiles.push(filePath);
}
```

### Single-Assignment Target Resolution
```javascript
// Only runs when user requests a single assignment (e.g. "sync just Homework 3.1")
let targetAN = null;
if (targetAssignment !== null) {
  const input = targetAssignment.toString().trim().replace(/^#/, '');

  // Strategy 1: exact assignment number
  if (/^\d+$/.test(input)) {
    const match = aeriesAssignments.find(a => a.assignmentNumber === input);
    if (match) targetAN = input;
  }

  // Strategy 2: exact name match (case-insensitive)
  if (!targetAN) {
    const inputLower = input.toLowerCase();
    const aeriesMatch = aeriesAssignments.find(a => a.name.toLowerCase() === inputLower);
    if (aeriesMatch) {
      targetAN = aeriesMatch.assignmentNumber;
    } else {
      for (const [an, momName] of Object.entries(assignmentCrossMap)) {
        if (momName.toLowerCase() === inputLower) { targetAN = an; break; }
      }
    }
  }

  // Strategy 3: fuzzy match
  if (!targetAN) {
    let bestAN = null, bestScore = 0;
    for (const aeriesA of aeriesAssignments) {
      const score = scoreAssignmentMatch(input, aeriesA.name);
      if (score > bestScore) { bestScore = score; bestAN = aeriesA.assignmentNumber; }
    }
    if (bestAN && bestScore >= 0.5) targetAN = bestAN;
  }

  if (!targetAN) throw new Error(`Cannot resolve target assignment: "${targetAssignment}"`);
  if (!assignmentCrossMap[targetAN]) throw new Error(`Target [${targetAN}] has no MOM match`);
}
```

---

## Phase 4 (Dry-Run Report) Details

### Diff categories

| Category | Meaning | Live-mode behavior |
|----------|---------|--------------------|
| `ready-to-enter` | MOM has numeric score and Aeries is blank | Eligible for live entry |
| `already-correct` | Aeries already matches expected value | Verify later; do not rewrite |
| `skip-exempt` | MOM is blank or exempt | Leave blank |
| `skip-nonzero` | Aeries already contains a non-zero score | Protect it; require explicit teacher approval to overwrite |
| `manual-review` | Low-confidence match, impossible values, or special-case handling | Stop for teacher review |

### Report requirements
- Summarize by assignment and by student.
- Show counts for each category.
- Call out every protected non-zero score explicitly.
- Require explicit teacher approval before Phase 5.

---

## Phase 5 Code -- Live Score Entry

### Critical runtime constraints
- **Batch <=6 students per execute call** -- MCP relay times out after ~10s
- **Save in a separate execute call** -- saving in same call as fill loop causes race condition
- **Save via `evaluate()`** -- `locator('#assignmentQuickAssignSave').click()` triggers navigation wait -> timeout

### Strategy selection

| Strategy | Use when | Notes |
|----------|----------|-------|
| `ScoresByAssignment` | Default path for full syncs | One assignment page shows all students |
| `ScoresByStudent` | Assignment page fails or halted run residue | Fallback and targeted recovery path |

### Assignment-page write rules
- Navigate to the assignment page for one assignment at a time.
- Work in **batches of 5 students**.
- Save after each batch and after the final short batch.
- Before each fill:
  - verify the page is still on the expected assignment
  - verify the row for the student `data-sn` exists
  - re-read the current Aeries score
  - **if the score is non-zero, skip it and log `skip-nonzero`** (protect existing scores)

### Score entry code
```javascript
// Fill + click-away commit (no read-back -- fast, reliable)
// Step 1: Click student's score cell to activate input
await aeriesPage.locator(cellSelector).click();
await aeriesPage.locator('table.assignments input.edit-text').first()
  .waitFor({ state: 'visible', timeout: 3000 });

// Step 2: Fill the score value
await aeriesPage.locator('table.assignments input.edit-text').first().fill(scoreStr);

// Step 3: Commit via click-away
//   - Non-last student: click next student's cell (commits current + activates next)
//   - Last student (multi): click first student's cell (commits current)
//   - Single student: press Tab (commits, moves to next column)
```

### Save code
```javascript
// CRITICAL: use evaluate() NOT locator().click()
// CRITICAL: must be a SEPARATE execute call from the fill loop
await aeriesPage.evaluate(() => document.querySelector('#assignmentQuickAssignSave').click());
await aeriesPage.waitForTimeout(1500);
```

### np protection
- Aeries may auto-change the possible-points column when overwriting or filling scores.
- Re-check `td[data-col-name="np"]` for touched rows and restore the required default if it drifts.

### Deduplication
```javascript
// Cache restore can produce duplicate toEnter items
for (const an of Object.keys(assignmentEntries)) {
  const seen = new Set();
  assignmentEntries[an] = assignmentEntries[an].filter(e => {
    const key = `${e.sn}:${an}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

### Fallback student-page route
```text
/teacher/gradebook/{gradebookNum}/S/ScoresByStudent/Index/{sn}
```
- Use only when assignment-page entry is unavailable or unsafe.
- Preserve the same non-zero protection and halt rules.

---

## Phase 6 Details -- Halt Detection

### Halt immediately if any of these occur
- URL changes to a login, sign-in, auth, or session-expired page
- Expected assignment table is missing
- Expected student row cannot be found by `data-sn`
- Dynamic score input never appears after the cell click
- Save control is missing or repeatedly fails
- Read-back or later verification shows the write did not persist
- Browser automation loses the gradebook context entirely

### Halt persistence
- Write the halt reason to the main state file.
- Mark affected student files with `result.status = "halted"` and append a structured error.
- Record: affected assignments, affected students, last successful batch, whether fallback mode was in use.

### Resume after halt
- Restore the authenticated session first.
- Reload the existing state and resume from the first incomplete batch.
- Do not delete or regenerate successful student files unless the user chooses a fresh restart.

---

## Phase 7 Code -- Verification

```javascript
const verifyReport = { verified: [], mismatch: [], missing: [], errors: [] };
const BASE = `${aeriesBase}/teacher/gradebook/${gradebookNum}/S/ScoresByAssignment/Index`;

for (const aeriesA of aeriesAssignments) {
  if (!assignmentCrossMap[aeriesA.assignmentNumber]) continue;
  if (targetAN && aeriesA.assignmentNumber !== targetAN) continue;
  const an = aeriesA.assignmentNumber;

  await aeriesPage.goto(`${BASE}/${an}`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));

  const rows = await aeriesPage.evaluate(() =>
    [...document.querySelectorAll('table.assignments tr.row')].map(r => ({
      sn: r.getAttribute('data-sn'),
      score: r.querySelector('td:first-child')?.textContent.trim() ?? ''
    }))
  );

  for (const { sn, score } of rows) {
    const aeriesName = snToAeriesName[sn];
    if (!aeriesName) continue;
    const entry = studentFileCache[aeriesName];
    if (!entry) continue;
    const momScore = entry.data.momScores?.[an];
    if (!momScore || momScore.isExempt || momScore.value === null) continue;
    const expectedScore = momScore.aeriesScore;
    if (expectedScore === null) continue;
    const actualScore = score === '' ? null : parseFloat(score);

    if (actualScore === null) {
      verifyReport.missing.push({ student: aeriesName, an, expected: expectedScore });
    } else if (Math.abs(actualScore - expectedScore) > 0.1) {
      verifyReport.mismatch.push({ student: aeriesName, an, expected: expectedScore, actual: actualScore });
    } else {
      verifyReport.verified.push({ student: aeriesName, an });
    }
  }
}
```

### Final statuses

| Status | Meaning |
|--------|---------|
| `verified` | Full-scope sync verified successfully |
| `partial-verified` | Single-assignment mode verified only the targeted assignment |
| `verify-failed` | Aeries value missing or mismatched after live mode |
| `halted` | Run stopped before verification completed |

### Acceptance rule
```text
pipelineHalted === false
missing === 0
mismatch === 0
```

---

## Common Selector Pitfalls

| Pitfall | Correct handling |
|---------|------------------|
| `table.gradebook tbody tr` for MOM rows | Use `#myTable tbody tr` and skip first row (Averages) |
| First `<td>` for MOM student name | Use the row `<th>` |
| `row.querySelectorAll('td')[columnIndex]` for score | Use `[...row.children][columnIndex]` (all children) |
| `cell.textContent` for MOM score | Use `cell.querySelector('a')?.getAttribute('data-ptv')` |
| `raw === ''` only for exempt check | Also check `!ptv` and `raw.startsWith('-')` |
| `th.textContent.trim()` for Aeries assignment name | Use `a.assignment-edit[data-assignment-name]` |
| `table a[href*="student"]` for Aeries students | Use `table.students tr.row a.student-name-link` |
| `input[name*="Score"]` for score inputs | Click `td:first-child`; input appears as `input.edit-text` |
| `?an=77` in score entry URL | Use path-based `/ScoresByAssignment/Index/77` |
| Entering raw MOM pts directly | Convert: `Math.round(value / maxPoints * 100 * 10) / 10` |
| Entering 0 for blank/exempt | Leave field empty |
| Looking up Aeries rows by name text | Build `sn -> aeriesName` map from students table |
| Overwriting existing non-zero scores | Skip and log `skip-nonzero`; require explicit teacher approval |
| `locator('#assignmentQuickAssignSave').click()` | Use `evaluate(() => ...)` to avoid navigation wait timeout |
| Fill loop >6 students in one execute call | Batch: <=6 students per execute call |
| Fill + save in same execute call | Save in SEPARATE execute call |
| Not checking `np` after score write | Re-check `td[data-col-name="np"]` and fix to 100 |
| Duplicate `toEnter` entries from cache | Deduplicate by `sn:an` key |
| Re-using cached Aeries scores in Phase 7 | Always re-scrape Aeries fresh |
| Using `browser.contexts()[0].pages()` | Use `context.pages()` |
