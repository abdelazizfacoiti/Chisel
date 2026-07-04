# Chisel

<p align="center">
  <img src="./assets/chisel-logo.png" alt="Chisel logo" width="360">
</p>

Plan tight. Mark intent. Let inline completion draft. Review every line.

Chisel is an instruction and command pack for AI coding tools. It helps engineers use fewer chat-agent tokens by moving from "agent writes the whole feature" to "agent plans, places precise TODO markers, then stops."

The chat agent does the high-leverage work: understand the task, inspect the repo, produce a small plan, and place concrete inline markers. GitHub Copilot or another inline completion engine drafts from those markers. You review every generated line.

Chisel v0 does not insert markers by itself. It installs provider-specific instructions that tell your coding agent how to plan, place markers, and stop before implementation.

## Status

Chisel is currently v0: an instruction and command pack.

It does not run its own code-mod engine yet. It installs instructions, commands, skills, and rules for supported AI coding tools.

## Why Chisel?

Most AI coding workflows jump from task description straight to full implementation. That is convenient, but it can be expensive, noisy, and hard to control.

Chisel creates a smaller loop:

1. Use the chat agent for planning and repo understanding.
2. Place small intent markers exactly where code should change.
3. Let inline completion draft local code.
4. Review every generated line.

The goal is not to avoid review. The goal is to make review easier.

## v0 Capabilities

Chisel v0 works through provider instruction files. Behavior depends on how well the active agent follows those instructions.

- Plan-first workflow: agent creates a short implementation plan and asks for approval before editing.
- Marker insertion workflow: the agent is instructed to insert tiny language-native TODO comments at relevant code locations after approval.
- Stop-before-code rule: agent must not write the full implementation unless you explicitly leave Chisel mode.
- Inline completion handoff: you use Copilot or another inline completion tool at each marker.
- Minimal session receipt: agent writes `.chisel/<session-id>.md` with task, files touched, item order, skipped items, and cleanup marker.
- Safe cleanup convention: remove only comments containing the exact `CHISEL:<session-id>` marker.
- Provider install pack: installer can drop the right instruction/command files for Codex, GitHub Copilot, Claude Code, Gemini, Cursor, and opencode.
- Codex plugin metadata: `.codex-plugin/plugin.json` is included for packaging Chisel as an installable Codex plugin later.

## 60-Second Example

User:

```text
Use Chisel for this task: add email validation to signup.
```

Agent:

```text
Plan ready:
1. Validate email format before submit.
2. Show inline error message.
3. Disable submit while invalid.

Approve marker pass?
```

After approval, the agent should place markers near the relevant code:

```ts
// TODO(chisel:item-1) CHISEL:2026-07-04-a1b2 Validate email format before submit.
// TODO(chisel:item-2) CHISEL:2026-07-04-a1b2 Show inline error message.
// TODO(chisel:item-3) CHISEL:2026-07-04-a1b2 Disable submit while invalid.
```

Now trigger inline completion at each marker, review the diff, run tests, then remove markers containing `CHISEL:2026-07-04-a1b2`.

Example marker inside `src/components/SignupForm.tsx`:

```tsx
function handleSubmit(event: FormEvent) {
  event.preventDefault();

  // TODO(chisel:item-1) CHISEL:2026-07-04-a1b2 Validate email format before submit and return early with an inline error.

  submitForm();
}
```

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

For all install options, providers, flags, uninstall steps, and manual copy commands, see [install.md](./install.md).

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

## Marker Quality Bar

A good marker should answer:

1. Where should the change happen?
2. What exact behavior should be added?
3. What should not be changed?
4. Can inline completion reasonably finish this in 1-20 lines?

## Safety Rules

- Do not write the full implementation in Chisel mode.
- Do not insert huge prompt comments.
- Do not overwrite existing code.
- Do not touch generated/vendor/build output.
- Do not touch lock files unless explicitly approved.
- If target location is unclear, skip the marker and say why.
- Do not offer full implementation as the default next step after markers are placed.
- User must review generated code and run tests.

## When Not To Use Chisel

Do not use Chisel for:

- Tiny one-line fixes.
- Tasks where you already know the exact implementation.
- Security-sensitive code where marker-driven completion may miss edge cases.
- Large refactors that need continuous architectural reasoning.
- Generated files, migrations, lock files, or vendored code unless explicitly approved.

## Limits

Chisel does not know exact Copilot usage or billing. It should not claim exact savings. It reduces expensive chat-agent usage by shifting implementation drafting to inline completion.

Chisel v0 is not a full CLI app. The included `chisel` command only installs provider files. A future version can add deterministic session JSON, status, cleanup, and marker insertion.

## Roadmap

- Deterministic marker scan and cleanup.
- `chisel status`.
- `chisel doctor`.
- Session receipts as JSON.
- Safer merge behavior for existing provider instruction files.
- Optional code-mod based marker insertion.
