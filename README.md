# Chisel

<p align="center">
  <img src="./assets/chisel-cover.png" alt="Chisel vintage programming book cover" width="520">
</p>

Plan tight. Mark intent. Let inline completion draft. Review every line.

Chisel is an instruction and command pack for AI coding tools. It helps engineers spend fewer chat-agent tokens by moving from "agent writes the whole feature" to "agent plans, places precise TODO markers, then stops."

The expensive agent does the high-leverage work: understand the task, inspect the repo, produce a small plan, and place concrete inline markers. GitHub Copilot or another inline completion engine drafts from those markers. You review every generated line.

## What Works Today

- Plan-first workflow: agent creates a short implementation plan and asks for approval before editing.
- Marker insertion: agent inserts tiny language-native TODO comments at the right code locations.
- Stop-before-code rule: agent must not write the full implementation unless you explicitly leave Chisel mode.
- Inline completion handoff: you use Copilot or another inline completion tool at each marker.
- Minimal session receipt: agent writes `.chisel/<session-id>.md` with task, files touched, item order, skipped items, and cleanup marker.
- Safe cleanup convention: remove only comments containing the exact `CHISEL:<session-id>` marker.
- Provider install pack: installer can drop the right instruction/command files for Codex, GitHub Copilot, Claude Code, Gemini, Cursor, and opencode.
- Codex plugin metadata: `.codex-plugin/plugin.json` is included for packaging Chisel as an installable Codex plugin later.

## Workflow

1. Say: "Use Chisel for this task: add validation to the checkout form."
2. Agent writes a concise plan.
3. You approve the plan.
4. Agent inspects files and inserts `TODO(chisel:item-N) CHISEL:<session-id>` markers.
5. Agent stops before implementation.
6. You trigger inline completion at each marker.
7. You review the diff, run tests, then remove Chisel markers.

## Install

From the repo where you want Chisel active:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only codex
```

Other targets:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only copilot
npx -y github:abdelazizfacoiti/Chisel -- --only claude
npx -y github:abdelazizfacoiti/Chisel -- --only cursor
npx -y github:abdelazizfacoiti/Chisel -- --all
```

Useful flags:

- `--only <provider>` installs one provider.
- `--all` installs every provider file.
- `--target <path>` installs into another project directory.
- `--dry-run` prints changes without writing.
- `--force` overwrites existing provider files.
- `--with-codex-prompt` also installs deprecated Codex custom prompt support to `~/.codex/prompts/chisel.md`.

Provider ids: `copilot`, `codex`, `claude`, `gemini`, `cursor`, `opencode`.

See [install.md](./install.md) for manual copy commands.

## Provider Support

| Tool | Installed files | How to invoke |
|---|---|---|
| Codex | `AGENTS.md`, `.codex/config.toml`, `.agents/skills/chisel/SKILL.md` | `$chisel`, `/skills`, or "use Chisel" |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/prompts/chisel.prompt.md` | Prompt file / command picker where supported |
| Claude Code | `CLAUDE.md`, `.claude/commands/chisel.md` | `/chisel <task>` |
| Gemini CLI | `GEMINI.md` | "use Chisel" |
| Cursor | `.cursor/rules/chisel.mdc` | "use Chisel" |
| opencode | `.opencode/AGENTS.md` | "use Chisel" |

Codex note: documented reusable workflows are skills. Repo-local `/chisel` is not the Codex path. Use `$chisel` or `/skills`. If you install `--with-codex-prompt`, restart Codex and invoke `/prompts:chisel`.

Plugin note: Chisel includes `.codex-plugin/plugin.json` with `skills: "./skills/"` so the same skill can be packaged as a Codex plugin.

## Marker Format

TypeScript, JavaScript, Java, C#, Kotlin:

```ts
// TODO(chisel:item-2) CHISEL:<session-id> Add email validation before submit.
```

Python, Shell, Ruby:

```py
# TODO(chisel:item-2) CHISEL:<session-id> Add email validation before submit.
```

HTML:

```html
<!-- TODO(chisel:item-2) CHISEL:<session-id> Add empty-state markup. -->
```

Good markers are local and concrete:

```tsx
// TODO(chisel:item-4) CHISEL:<session-id> Replace flat card surface with subtle border, shadow, and pressed state styles.
```

Weak markers are too broad:

```tsx
// TODO(chisel:item-4) CHISEL:<session-id> Improve card polish.
```

Each marker should guide one inline completion, usually 1-20 lines.

## Safety Rules

- Do not write the full implementation in Chisel mode.
- Do not insert huge prompt comments.
- Do not overwrite existing code.
- Do not touch generated/vendor/build output.
- Do not touch lock files unless explicitly approved.
- If target location is unclear, skip the marker and say why.
- Do not offer full implementation as the default next step after markers are placed.
- User must review generated code and run tests.

## Limits

Chisel does not know exact Copilot usage or billing. It should not claim exact savings. It reduces expensive chat-agent usage by shifting implementation drafting to inline completion.

Chisel v0 is not a full CLI app. The included `chisel` command only installs provider files. A future app can add deterministic session JSON, status, cleanup, and marker insertion.
