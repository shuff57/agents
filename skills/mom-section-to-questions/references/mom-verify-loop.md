# MOM Create → Verify → Add Loop

Exact Playwriter snippets for Phase 8. Validated against MOM on 2026-04-19 across 12 auto-graded questions.

## Setup (once)

```bash
# If no session yet:
playwriter session new
# Note the session id that comes back (e.g. 2)
```

Confirm the extension is connected to the MOM tab:

```bash
playwriter -s <sid> -e 'console.log(context.pages().length, context.pages().map(p => p.url()))'
```

Extract `cid` and `aid` from the tab URL (usually `addquestions2.php?aid=NNN&cid=MMM`).

## Install helpers in session state

Install once per session. Wraps create/save and add-to-assignment so the main loop is short.

```bash
playwriter -s <sid> -e "$(cat <<'EOF'
const fs = require('node:fs');

state.cid = '<CID>';
state.aid = '<AID>';

state.parseFile = function(path) {
  const content = fs.readFileSync(path, 'utf8');
  return {
    name: content.match(/DESCRIPTION:\s*([\s\S]*?)===/)?.[1]?.trim() || '',
    cc:   (content.match(/\/\/ === COMMON CONTROL ===\s*\n([\s\S]*?)\n\/\/ === QUESTION TEXT ===/)?.[1] || '').trim(),
    qt:   (content.match(/\/\/ === QUESTION TEXT ===\s*\n([\s\S]*?)\n\/\/ === ANSWER ===/)?.[1] || '').trim(),
    ans:  (content.match(/\/\/ === ANSWER ===\s*\n([\s\S]*)$/)?.[1] || '').trim(),
  };
};

state.createAndSave = async function(path) {
  const q = state.parseFile(path);
  await state.page.goto(`https://www.myopenmath.com/course/moddataset.php?cid=${state.cid}`, { waitUntil: 'domcontentloaded' });
  await state.page.waitForTimeout(2000);
  await state.page.locator('#description').fill(q.name);
  await state.page.getByRole('button', { name: /Number/ }).first().click();
  await state.page.waitForTimeout(400);
  await state.page.locator('role=link[name="Multipart"]').click();
  await state.page.waitForTimeout(800);
  await state.page.evaluate((x) => {
    const cms = Array.from(document.querySelectorAll('.CodeMirror'));
    const byId = {};
    for (const c of cms) { const id = c.previousElementSibling?.id; if (id) byId[id] = c.CodeMirror; }
    byId.control.setValue(x.cc);
    byId.qtext.setValue(x.qt);
    if (byId.solution) byId.solution.setValue(x.ans);
    byId.control.save(); byId.qtext.save(); if (byId.solution) byId.solution.save();
  }, q);
  await state.page.getByRole('button', { name: 'Save' }).first().click();
  await state.page.waitForLoadState('domcontentloaded');
  await state.page.waitForTimeout(2500);
  const m = state.page.url().match(/[?&]id=(\d+)/);
  return { name: q.name, qid: m ? m[1] : null };
};

state.updateSavedCC = async function(qid, newCC) {
  await state.page.goto(`https://www.myopenmath.com/course/moddataset.php?id=${qid}&cid=${state.cid}`, { waitUntil: 'domcontentloaded' });
  await state.page.waitForTimeout(2500);
  await state.page.evaluate((v) => {
    const cm = Array.from(document.querySelectorAll('.CodeMirror'))
      .find(c => c.previousElementSibling?.id === 'control').CodeMirror;
    cm.setValue(v); cm.save();
  }, newCC);
  await state.page.getByRole('button', { name: 'Save' }).first().click();
  await state.page.waitForLoadState('domcontentloaded');
  await state.page.waitForTimeout(2500);
};

state.readRenderedQuestion = async function(qid) {
  await state.page.goto(`https://www.myopenmath.com/course/testquestion2.php?cid=${state.cid}&qsetid=${qid}`, { waitUntil: 'domcontentloaded' });
  await state.page.waitForTimeout(2000);
  return state.page.evaluate(() => document.querySelector('.question')?.textContent?.trim() || '');
};

state.submitAnswer = async function(answers) {
  const ids = await state.page.evaluate(() => Array.from(document.querySelectorAll('.question input[type=text]')).map(i => i.id));
  for (let i = 0; i < ids.length; i++) {
    await state.page.locator('#' + ids[i]).fill(String(answers[i]));
  }
  await state.page.getByRole('button', { name: 'Submit' }).click();
  await state.page.waitForTimeout(2500);
  return state.page.evaluate(() => Array.from(document.querySelectorAll('.scoremarker')).map(s => s.textContent.trim()));
};

state.diagnosePreview = async function() {
  return state.page.evaluate(() => {
    const errs = [];
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length === 0 && /Error in question|unallowed macro|missing \$anstypes/i.test(el.textContent || '')) {
        errs.push(el.textContent.trim());
      }
    }
    return errs.slice(0, 5);
  });
};

state.addToAssignment = async function(qid, desc) {
  await state.page.goto(`https://www.myopenmath.com/course/addquestions2.php?aid=${state.aid}&cid=${state.cid}`, { waitUntil: 'domcontentloaded' });
  await state.page.waitForTimeout(3000);
  await state.page.locator('#search').fill(desc);
  await state.page.getByRole('button', { name: 'Search', exact: true }).click();
  await state.page.waitForTimeout(3500);
  const cbId = await state.page.evaluate(q => {
    for (const row of document.querySelectorAll('tbody tr')) {
      if (row.textContent.includes(q)) return row.querySelector('input[type=checkbox]')?.id || null;
    }
    return null;
  }, qid);
  if (!cbId) return false;
  await state.page.locator('#' + cbId).check();
  await state.page.waitForTimeout(400);
  await state.page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Add');
    if (btns.length) btns[0].click();
  });
  await state.page.waitForTimeout(4000);
  return state.page.evaluate(() => {
    const h = Array.from(document.querySelectorAll('h2, h3')).find(x => /Questions in Assessment/i.test(x.textContent));
    const form = h?.closest('form') || h?.parentElement;
    const table = form?.querySelector('table');
    if (!table) return [];
    return Array.from(table.querySelectorAll('tbody tr'))
      .map(r => [...r.querySelectorAll('td')].map(c => c.textContent.trim()).filter(t => /^\d{7,}$/.test(t))[0])
      .filter(Boolean);
  }).then(ids => ids.includes(qid));
};

state.page = context.pages()[0];
console.log('helpers installed. cid:', state.cid, 'aid:', state.aid);
EOF
)"
```

## Per-question loop

```bash
# CREATE
playwriter -s <sid> -e 'state.q = await state.createAndSave("<repo>/questions/<topic>/q<N>-<slug>.php"); console.log(JSON.stringify(state.q));'

# VERIFY (non-randomized: expected answer known in advance)
playwriter -s <sid> -e 'const scores = await state.readRenderedQuestion(state.q.qid).then(() => state.submitAnswer([<a0>, <a1>, ...])); console.log(scores);'

# VERIFY (randomized: parse rendered values first)
playwriter -s <sid> -e 'const text = await state.readRenderedQuestion(state.q.qid); const m = text.match(/<regex extracting values>/); const expected = <compute from m[1], m[2], ...>; const scores = await state.submitAnswer([expected]); console.log("expected:", expected, "scores:", scores);'

# If any part is Incorrect, run diagnose:
playwriter -s <sid> -e 'const errs = await state.diagnosePreview(); console.log(errs);'

# ADD
playwriter -s <sid> -e 'await state.addToAssignment(state.q.qid, "<first ~30 chars of description>").catch(() => null);'

# VERIFY ADD
playwriter -s <sid> -e 'const ids = await state.page.evaluate(() => { const h = Array.from(document.querySelectorAll("h2, h3")).find(x => /Questions in Assessment/i.test(x.textContent)); const form = h?.closest("form") || h?.parentElement; const t = form?.querySelector("table"); return t ? Array.from(t.querySelectorAll("tbody tr")).map(r => [...r.querySelectorAll("td")].map(c => c.textContent.trim()).filter(s => /^\\d{7,}$/.test(s))[0]).filter(Boolean) : []; }); console.log("assigned:", ids);'
```

## Timeout handling

Most of the `.click('Save')` and `.click('Add')` commands time out at 10s. That is expected — the underlying browser action typically succeeded. Do NOT retry. Instead, re-query state:

- After a Save timeout: `console.log(state.page.url())` — if it matches `moddataset.php?process=true&cid=...&id=<QID>` the save worked.
- After an Add timeout: re-read the "Questions in Assessment" table and check whether the qid is present.

Only retry the action if the state check confirms it did not happen.

## Auto-fix recipe

When `submitAnswer` returns `Incorrect` on a question you believe is correct:

1. Re-read the rendered question. If you see `{  }` empty interpolation or "Error in question", call `state.diagnosePreview()`.
2. Match the error against `references/autofix-patterns.md`.
3. Patch the .php file with `Edit`, re-parse, and call `state.updateSavedCC(qid, newCC)` with ONLY the CC section (preserve qid — do not create a new question).
4. Re-run the VERIFY step.
5. If still Incorrect after 2 patches, stop and show the teacher the diagnose output.

## Common expected-answer extractors

**2-circle Venn (total):**
```js
const m = text.match(/(\d+)\s+people own.*?,\s+(\d+)\s+people own.*?,\s+and\s+(\d+)\s+own both/);
const total = +m[1] + +m[2] - +m[3];
```

**2-circle Venn (neither):**
```js
const m = text.match(/Of\s+(\d+)\s+\w+,\s+(\d+)\s+[^,]+,\s+(\d+)\s+[^,]+,\s+and\s+(\d+)\s+do both/);
const neither = +m[1] - (+m[2] + +m[3] - +m[4]);
```

**Set cardinality from listed elements:**
```js
const m = text.match(/set\s*\{\s*([^}]+?)\s*\}/);
const n = m[1].split(',').length;
```
