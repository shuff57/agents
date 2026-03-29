# Remaster Chapter Reference

## Writing Guidelines
- Plain English for first-year undergrads, avoid passive voice, use "we" and "you"
- Context Pauses: brief real-world relevance when complex terms introduced
- Insight Notes: blockquotes for special insights and "aha!" moments

## Formatting
- Key terms: **Bold**
- Inline math: `$ x^2 $`
- Block math: `$$ f(x) = mx + b $$`

## Numbering (CRITICAL)
All numbering is chapter-prefixed sequential across the ENTIRE chapter:
- Examples: `Example C.N` (e.g., Example 1.1, 1.2, 1.3...)
- Definitions: `Definition C.N: [Term]`
- Try It Now: `Try It Now C.N`

## Source Attribution (CRITICAL)
Every Example, Definition, Try It Now, and Problem Set needs:
```
**Source:** [Book Name]
```

## Structure
- Section headers: `# X.Y [Title]` (do NOT change format)
- Table of Contents at beginning
- Callout boxes for key rules (blockquote with bold label)
- Terminology blocks for related technical terms
- Subsections for rule lists with 2+ items

## Problem Sets
- Preserve existing, retain Source tag
- Do NOT generate solutions (separate pipeline step)

## Try It Now Exercises
- Place after each major concept
- Use `<details><summary>Solution</summary>` for collapsible solutions
- Keep solutions concise (3-5 steps max)
