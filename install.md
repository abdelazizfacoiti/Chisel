# Install Chisel Instructions

Chisel v0 is an instruction pack, not a standalone app. The included `chisel` command only installs provider instruction and command files.

## One-liner With npx

From the repo where you want Chisel active:

```bash
npx -y github:<your-github-user-or-org>/Chisel -- --only codex
```

Use another provider id when needed:

```bash
npx -y github:<your-github-user-or-org>/Chisel -- --only copilot
npx -y github:<your-github-user-or-org>/Chisel -- --only cursor
npx -y github:<your-github-user-or-org>/Chisel -- --all
```

For local testing from this folder:

```bash
node bin/chisel-install.js --only codex --target /path/to/project --dry-run
```

Flags:

- `--only <provider>` installs one provider.
- `--all` installs every provider file.
- `--target <path>` chooses the project directory. Default: current directory.
- `--dry-run` prints writes without touching files.
- `--force` overwrites existing provider files.

Provider ids: `copilot`, `codex`, `claude`, `gemini`, `cursor`, `opencode`.

Copy one or more provider files into the repo where you want the workflow active.

## GitHub Copilot

```bash
mkdir -p .github
cp Chisel/providers/copilot/copilot-instructions.md .github/copilot-instructions.md
mkdir -p .github/prompts
cp Chisel/providers/copilot/.github/prompts/chisel.prompt.md .github/prompts/chisel.prompt.md
```

In VS Code Copilot Chat, this should expose the `chisel` prompt file in the prompt/command picker.

## Codex

```bash
cp Chisel/providers/codex/AGENTS.md AGENTS.md
mkdir -p .codex/prompts
cp Chisel/providers/codex/.codex/config.toml .codex/config.toml
cp Chisel/providers/codex/.codex/prompts/chisel.md .codex/prompts/chisel.md
```

Then use:

```text
/chisel improve the checkout form validation
```

Codex plugin-shaped metadata is also available at:

```text
Chisel/providers/codex/.codex-plugin/plugin.json
```

## Claude Code

```bash
cp Chisel/providers/claude/CLAUDE.md CLAUDE.md
mkdir -p .claude/commands
cp Chisel/providers/claude/.claude/commands/chisel.md .claude/commands/chisel.md
```

Then use:

```text
/chisel improve the checkout form validation
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
