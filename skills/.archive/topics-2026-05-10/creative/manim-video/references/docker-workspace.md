# Docker Workspace for Manim

**Use Docker when system deps can't be installed** (no sudo, WSL without apt, macOS without Homebrew). Manim's C-extension deps (`manimpango` → pangocairo → cairo/pango/LaTeX) are notoriously difficult to satisfy on developer machines.

## Docker image recipe

```dockerfile
FROM python:3.11-slim

# python:slim has NO apt sources — MUST inject before apt-get works
RUN echo "deb http://deb.debian.org/debian bookworm main" > /etc/apt/sources.list

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-pictures \
    dvisvgm \
    libcairo2-dev \
    libpango1.0-dev \
    pkg-config \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    manim==0.20.1 \
    Pillow \
    opencv-python-headless

WORKDIR /workspace
# COPY scripts here at build time or mount at runtime

# Render with volume-mounted output dir
# manim -qh --format mp4 --media_dir=/output scene.py SceneName
CMD ["bash"]
```

**Why `libpango-1.0-dev` specifically?** Manim's `manimpango` C extension runs `pkg-config --print-errors --atleast-version 1.30.0 pangocairo` at build time. Without `libpango-1.0-dev`, this check fails silently (pip says "built wheel" but imports fail at runtime with `ImportError: libpangocairo-1.0.so.0`).

## Rendering workflow

```bash
# Build
docker build -t manim-local .

# Run renders (volume-mount output so files land on host)
docker run --rm \
  -v "$(pwd)/output":/output \
  manim-local

# Inside container, per-theme render loop:
for theme in dark warm light; do
  mkdir -p /output/$theme
  manim -qh --format mp4 --media_dir=/output/$theme \
    /workspace/$theme/script.py \
    Scene1 Scene2 Scene3 Scene4 Scene5 Scene6 Scene7
done
```

## Rendering output structure

Inside the container, manim writes to `--media_dir`. Mount it as a volume:

```
host/                          # ← output/
  dark/
    1080p60/
      Scene1.mp4
      Scene2.mp4
      ...
  warm/
  light/
```

## Concat + mux (WSL + Docker path workaround)

**The problem**: When the host filesystem is `/mnt/c/` (WSL) and you mount a Windows path into Docker, ffmpeg inside the container cannot open concat files referencing paths outside the container mount. Paths in the concat file are resolved relative to the container's working directory, not the host filesystem.

**Solution — copy into container, mux, write to mounted output**:

1. Mount three volumes: scene MP4s (read-only), voiceover MP3s (read-only), output dir (read-write)
2. Copy source files into container `/tmp/`
3. Build concat files with absolute container paths (`/tmp/...`)
4. Run all ffmpeg work inside the container
5. Final mux output goes directly to mounted `/final/`

```bash
docker run --rm \
  -v "$RENDER_DIR":/scenes:ro \
  -v "$VOICE_DIR":/voice:ro \
  -v "$OUT_DIR":/final \
  manim-local \
  sh -c "
    mkdir -p /tmp/mux/scenes /tmp/mux/audio /tmp/mux/out
    cp /scenes/*.mp4 /tmp/mux/scenes/
    cp /voice/*.mp3 /tmp/mux/audio/

    # Build concat lists with absolute container paths
    for i in 1 2 3 4 5 6 7; do
      scene_name=\$(ls /tmp/mux/scenes/ | grep \"Scene\$i\" | head -1)
      echo \"file '/tmp/mux/scenes/\$scene_name'\" >> /tmp/mux/video_concat.txt
      echo \"file '/tmp/mux/audio/scene\$i.mp3'\" >> /tmp/mux/audio_concat.txt
    done

    ffmpeg -y -f concat -safe 0 -i /tmp/mux/video_concat.txt \
      -c:v libx264 -preset fast -crf 23 -an /tmp/mux/out/video.mp4

    ffmpeg -y -f concat -safe 0 -i /tmp/mux/audio_concat.txt \
      -c:a aac -b:a 128k /tmp/mux/out/audio.m4a

    ffmpeg -y -i /tmp/mux/out/video.mp4 -i /tmp/mux/out/audio.m4a \
      -c:v copy -c:a aac -shortest /final/final_video.mp4
  "
```

Key: `/final` is the mounted output directory on the host. All intermediate work happens in `/tmp/` inside the container. Concat file paths are absolute inside the container (`/tmp/...`).

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Package 'pangocairo' was not found` | Missing `libpango1.0-dev` | Add to apt install |
| `E: Unable to locate package texlive-*` | python:slim has no sources | Inject bookworm deb line |
| `libpangocairo-1.0.so.0: cannot open shared object` | manimpango wheel built without pango dev | Rebuild inside Docker with full deps |
| `ERROR: metadata-generation-failed ... Unknown compiler(s)` | `manimpango` needs C compiler to build from source | Add `build-essential` to apt install |
| `E: Unable to locate package libpango-1.0-dev` | Wrong package name on Debian/Ubuntu | Use `libpango1.0-dev` (no hyphen) |
| `FileNotFoundError: No such file or directory: 'dvisvgm'` | Manim LaTeX rendering needs dvisvgm | Add `dvisvgm` to apt install + `texlive-pictures` |
| ImportError after pip install succeeds | pango check passed but runtime link failed | Ensure libpango1.0-dev was present during pip install |
