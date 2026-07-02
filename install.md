# Install Chisel Instructions

Chisel v0 is an instruction pack, not a standalone app.

Copy one or more provider files into the repo where you want the workflow active.

## GitHub Copilot

```bash
mkdir -p .github
cp Chisel/providers/copilot/copilot-instructions.md .github/copilot-instructions.md
```

## Codex

```bash
cp Chisel/providers/codex/AGENTS.md AGENTS.md
mkdir -p .codex/prompts
cp Chisel/providers/codex/.codex/config.toml .codex/config.toml
cp Chisel/providers/codex/.codex/prompts/chisel.md .codex/prompts/chisel.md
```

Codex plugin-shaped metadata is also available at:

```text
Chisel/providers/codex/.codex-plugin/plugin.json
```

## Claude Code

```bash
cp Chisel/providers/claude/CLAUDE.md CLAUDE.md
```

Or install the skill body from:

```text
Chisel/skills/chisel/SKILL.md
```

## Gemini

```bash
cp Chisel/providers/gemini/GEMINI.md GEMINI.md
```

## Cursor

```bash
mkdir -p .cursor/rules
cp Chisel/providers/cursor/chisel.mdc .cursor/rules/chisel.mdc
```

## opencode

```bash
mkdir -p .opencode
cp Chisel/providers/opencode/AGENTS.md .opencode/AGENTS.md
```
