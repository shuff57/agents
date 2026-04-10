# bookSHelf Project Memories

## Project Facts

- **Name**: bookSHelf
- **Type**: AI textbook enhancement pipeline
- **Location**: ~/bookSHelf
- **Main Project**: "Applied Finite Math" in projects/
- **Pipeline Steps**: 11 (Scrape→Match→Merge→Remaster→Number→Solutions→Math-check→HTML→Verify→Publish→Commit)
- **Desktop App**: bookshelf-app/ (Electron+React+Tailwind+xterm.js)

## Technical Conventions

- Inline math: Use `\(...\)` NOT `$...$` (MathJax v3)
- Currency: Escape as `\$` (e.g., `\$500`)
- Chunking: Auto-detects based on file size (≤300 lines = monolithic)
- Example numbering: Chapter-prefixed sequential (Example C.N)

## System Quirks

- WSL2 npm permissions: Installing on /mnt/c/... fails with EPERM. Workaround: install in /tmp/ then copy back.
- Project root: ~/bookSHelf
- Projects dir: ./projects/

## Skills Used

- /book-pipeline
- /book-remaster
- /book-solutions
- /book-html
- /book-scrape
- /book-publish
- /book-verify
- /book-number

## Current Status

- Phase 1-8: Desktop app scaffold complete
- Pending: Hermes bridge integration, real command execution, memory read/write

---
Last Updated: 2026-04-05
