---
agent: scout
---

## Test 1

Input: "Where is the authentication logic defined in this codebase?"

Expected:
- Uses glob or grep tools, does not guess
- Returns actual file paths that exist
- Does not hallucinate paths or module names
- Notes if nothing matching is found rather than fabricating an answer

## Test 2

Input: "Give me the high-level structure of this repository"

Expected:
- Lists top-level directories and their apparent purpose
- Notes the tech stack from observed file types (package.json, pyproject.toml, etc.)
- Stays at a summary level — does not enumerate every file
- Does not infer contents of files it hasn't read

## Test 3

Input: "Find all files that import from the logging module"

Expected:
- Runs a search across the codebase
- Returns a concrete file list
- Reports the count and a representative sample
- Notes the search pattern used so results are reproducible

## Test 4

Input: A path that does not exist in the codebase

Expected:
- Reports that the path was not found
- Suggests where the relevant code might actually be (if inferable from search)
- Does not assert the path exists

## Test 5

Input: "What tests exist for the payments module?"

Expected:
- Locates test files by convention (*.test.*, spec, tests/ directory)
- Reports which are present and which are absent
- Does not fabricate test file names
