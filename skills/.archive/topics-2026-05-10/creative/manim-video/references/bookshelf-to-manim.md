# bookSHelf → Manim Video Pipeline

Natural workflow: identify a bookSHelf section with strong visual content, then produce a 3Blue1Brown-style animated explainer from it.

## When this applies

- Section has geometric/statistical visuals (histograms, scatterplots, transformations, curves)
- Section is 200-500 lines (short enough for 4-7 minute video)
- Topic has clear before/after or step-by-step structure
- User wants voiceover + animated visuals

## Topic selection criteria

Good candidates have:
1. **Clear visual metaphor** — something that animates better than it reads (histogram reshaping, scatterplot spreading, residual pattern clearing)
2. **Short narrative arc** — 3-5 "aha moments" that fit 5-7 scenes
3. **Textbook density** — the bookSHelf remaster already has worked examples and explanations; extract the narrative from Context Pause / Insight Note blocks
4. **Self-contained math** — avoid sections that require extensive notation derivation on screen

### Signals a section is ideal

- Words in the section: "distribution", "transform", "pattern emerges", "before/after", "spread out", "compress"
- Visual content: histograms, scatterplots, residual plots, curves, heatmaps
- Conceptual: the explanation improves when you SEE the data reshape (log transforms, least squares, skew correction)

### Signals to skip

- Heavy algebraic derivation (formulas for formulas' sake — better as static images)
- Sections > 800 lines (too long for focused video; consider splitting or pick a subsection)
- Requires 3D geometry or interactive widgets

## Workflow

1. **Survey** — read `Chapter_N_Numbered/*.md` to find sections with strong visual beats
2. **Pick** — select based on criteria above; recommend 8.3-style sections (300-500 lines, visual-heavy)
3. **Plan** — write `plan.md`: narrative arc, scene list, color palette, voiceover script
4. **Script** — write `*/script.py` (one `SceneN_Name` class per scene, 7-10 scenes typical)
5. **Render** — Docker or native; `-ql` for draft iteration, `-qh` for production
6. **Voiceover** — TTS per scene using `text_to_speech` tool
7. **Mux** — ffmpeg concat scenes, concat audio clips, mux together
8. **Deliver** — final MP4 in project `final/` directory

## Output structure

```
manim-videos/
  {section-slug}/
    plan.md
    dark/script.py      # dark/classic theme
    warm/script.py      # warm academic theme
    light/script.py     # clean minimal theme
    voiceover/
      scene1.mp3
      scene2.mp3
      ...
    output/            # Docker volume mount
      dark/
      warm/
      light/
    final/
      {slug}_dark.mp4
      {slug}_warm.mp4
      {slug}_light.mp4
```

## Style variants

When user asks for multiple styles, generate three script files with identical scene structure but different color constants:

| Style | Background | Primary | Secondary | Accent |
|-------|-----------|---------|-----------|--------|
| Dark (default 3B1B) | `#1C1C1C` | `#58C4DD` | `#83C167` | `#FFFF00` |
| Warm academic | `#2D2B55` | `#FF6B6B` | `#FFD93D` | `#6BCB77` |
| Light minimal | `#FAFAFA` | `#2D2D2D` | `#555555` | `#0066CC` |
