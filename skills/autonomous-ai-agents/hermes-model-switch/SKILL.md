---
name: hermes-model-switch
description: Switch models and providers in Hermes — persistently, per-session, or per-query. Covers config.yaml edits, CLI flags, slash commands, custom endpoints, credential setup, profiles, and delegation model config.
triggers:
  - switch model
  - change model
  - change provider
  - switch provider
  - use a different model
  - set default model
  - hermes model
  - which model
  - configure model
  - ollama hermes
  - openrouter hermes
---

# Hermes Model & Provider Switching

There are four layers at which you can set the model in Hermes. Know which one you need:

1. Default (persistent)  — config.yaml, stays across all sessions
2. Per-session           — hermes chat --model / --provider flag, or /model in-session
3. Per-query             — hermes chat -q "..." -m model
4. Subagent delegation   — delegation section in config.yaml (controls delegate_task model)

---

## 1. Config format

config.yaml model block (at ~/.hermes/config.yaml or the active profile's config.yaml):

  model:
    provider: copilot          # provider ID (see list below)
    default: claude-sonnet-4.6 # model ID within that provider

Full format: provider:model-id — e.g. "github-copilot/claude-sonnet-4.6"
The config splits it into provider + default fields.

Current setup on this machine:
  provider: copilot
  default:  claude-sonnet-4.6

---

## 2. Persistent switch (recommended)

### Interactive picker (easiest)

  hermes model

Opens a TUI picker. Walks through provider auth, shows all available models, sets config.yaml on save.

### Direct config edit

  hermes config set model.provider copilot
  hermes config set model.default claude-sonnet-4.6

Or open in editor:
  hermes config edit

Restart the CLI after changing config to pick up the new default.

---

## 3. Per-session switch

Start a new session with a specific model:

  hermes chat -m anthropic/claude-opus-4      # provider/model-id
  hermes chat -m gpt-4o                        # model only (uses configured provider)
  hermes chat --provider openrouter -m anthropic/claude-opus-4

Or switch mid-session with the slash command:
  /model                          # show current model
  /model claude-sonnet-4.6        # switch to model (same provider)
  /model openrouter/gpt-4o        # switch provider and model

Note: mid-session model switch takes effect on the NEXT turn.

---

## 4. Per-query (one-shot)

  hermes chat -q "summarize this" -m anthropic/claude-haiku-3.5
  hermes chat -q "..." --provider openrouter -m qwen/qwen3-235b-a22b

---

## 5. Provider list and required credentials

Valid --provider values (from hermes chat --help):
  auto, openrouter, nous, openai-codex, copilot-acp, copilot,
  anthropic, gemini, huggingface, zai, kimi-coding, minimax,
  minimax-cn, kilocode

Full provider catalog is in ~/.hermes/models_dev_cache.json (110 providers).

### Key providers on this machine

Provider        | ID in config    | Env var / auth              | Status
---             | ---             | ---                         | ---
GitHub Copilot  | copilot         | COPILOT_GITHUB_TOKEN in .env | active (current default)
Ollama (local)  | ollama          | custom_providers block       | configured (localhost:11434)
OpenRouter      | openrouter      | OPENROUTER_API_KEY in .env  | not set
Anthropic       | anthropic       | ANTHROPIC_API_KEY in .env   | not set
OpenAI          | openai          | OPENAI_API_KEY in .env      | not set (points to ollama)
Google Gemini   | gemini          | GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY | not set
xAI Grok        | xai             | XAI_API_KEY in .env         | not set
Groq            | groq            | GROQ_API_KEY in .env        | not set
DeepSeek        | deepseek        | DEEPSEEK_API_KEY in .env    | not set

### Adding an API key

  hermes config env-path     # prints path to .env
  # Edit ~/.hermes/.env and add:
  OPENROUTER_API_KEY=sk-or-...
  ANTHROPIC_API_KEY=sk-ant-...

Or use the auth pool:
  hermes auth add openrouter

---

## 6. Custom / Ollama endpoint

For local models (Ollama) use custom_providers in config.yaml:

  custom_providers:
    - name: ollama
      base_url: http://localhost:11434/v1
      # api_key: optional (ollama doesn't need one)

Then reference by name:
  hermes chat -m ollama/llama3.3:70b
  hermes config set model.provider ollama
  hermes config set model.default llama3.3:70b

Current machine already has ollama configured at localhost:11434.

IMPORTANT: To actually route to a custom_provider, you must use the "custom:" prefix
when setting model.provider in config.yaml:

  hermes config set model.provider custom:ollama   # CORRECT — routes to ollama
  hermes config set model.provider ollama           # WRONG — falls through to openrouter

This is because Hermes checks if the provider name is a known built-in first. Since
"ollama" resolves as a built-in alias (to "custom"), it bypasses the custom_providers
lookup unless you prefix it with "custom:".

Multiple custom providers are supported:
  custom_providers:
    - name: ollama
      base_url: http://localhost:11434/v1
    - name: another-local
      base_url: http://localhost:8000/v1
      api_key: optional-token

---

## 7. Delegation model (subagent tasks)

When Hermes spawns subagents via delegate_task, it uses the main model by default.
To override:

  delegation:
    model: openrouter/anthropic/claude-haiku-3.5   # cheaper model for subagents
    provider: openrouter
    max_iterations: 50

Add this block to config.yaml.

---

## 8. Smart model routing

Auto-route cheap tasks to a fast/cheap model:

  smart_model_routing:
    enabled: true
    cheap_model: openrouter/google/gemini-flash-1.5

Add to config.yaml. Hermes uses judgment to route trivial tasks to the cheap model.

---

## 9. Per-profile model

Each profile has its own config.yaml. Use profiles to maintain separate model configs:

  hermes profile create fast-mode
  hermes -p fast-mode config set model.provider openrouter
  hermes -p fast-mode config set model.default google/gemini-flash-1.5

  # Start a session with this profile's model
  hermes -p fast-mode

Existing profiles on this machine:
  bookshelf    — ollama/glm-5.1:cloud (localhost:11434)
  hermesagent  — ollama/glm-5.1:cloud (localhost:11434)

---

## 10. Common switching patterns

Switch to OpenRouter for a session:
  hermes chat --provider openrouter -m anthropic/claude-opus-4

Use a local Ollama model for one query:
  hermes chat -q "explain this code" -m ollama/qwen2.5-coder:32b

Make OpenRouter the permanent default:
  hermes config set model.provider openrouter
  hermes config set model.default anthropic/claude-sonnet-4-5
  # restart hermes

Switch back to Copilot:
  hermes config set model.provider copilot
  hermes config set model.default claude-sonnet-4.6

Use interactive picker to browse all models:
  hermes model

---

## Pitfalls

- After editing config.yaml, restart the CLI — the model is loaded at startup.
- /model mid-session takes effect on the NEXT turn, not immediately.
- hermes chat --provider must match a valid provider ID from --help, not the catalog key
  (e.g. "copilot" not "github-copilot", "zai" not "zhipuai").
- Ollama models use "provider/model:tag" format — e.g. ollama/llama3.3:70b.
- The OPENAI_API_KEY on this machine points to localhost (ollama passthrough) — don't
  overwrite it without checking OPENAI_BASE_URL too.
- custom_providers names are arbitrary — use them as the provider prefix in model strings.
- models_dev_cache.json provider keys ≠ --provider flag values. Use the table above to map.
- If a model is missing from the picker, check models_dev_cache.json and verify the
  provider's env var is set in ~/.hermes/.env.
