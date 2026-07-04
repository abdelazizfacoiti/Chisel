# Chisel

<p align="center">
  <img src="./assets/chisel-logo.png" alt="Chisel logo" width="360">
</p>

Plan tight. Mark intent. Let inline completion draft. Review every line.

Chisel is an instruction and command pack for AI coding tools. It helps engineers use fewer chat-agent tokens and keep more control by moving from "agent writes the whole feature" to "agent plans, places precise TODO markers, then stops."

The chat agent does the high-leverage work: understand the task, inspect the repo, produce a small plan, and place concrete inline markers. GitHub Copilot or another inline completion engine can draft from those markers, or you can implement them by hand. You review every generated line either way.

Chisel v0.2 does not run its own deterministic marker-insertion engine. It installs provider-specific instructions that tell your coding agent how to plan, place markers, and stop before implementation. It also includes local status, cleanup, and doctor commands so sessions are easier to trust.

## Status

Chisel is currently v0.2: an instruction and command pack with a lightweight local trust layer.

It does not run its own code-mod marker insertion engine yet. It installs instructions, commands, skills, and rules for supported AI coding tools, then provides deterministic local scan, status, cleanup, and install health checks.

## Why Chisel?

Most AI coding workflows jump from task description straight to full implementation. That is convenient, but it can be expensive, noisy, and hard to control.

Chisel creates a smaller loop:

1. Use the chat agent for planning and repo understanding.
2. Place small intent markers exactly where code should change.
3. Let inline completion draft local code.
4. Review every generated line.

The goal is not to avoid review. The goal is to make review easier.

## Who Chisel Is For

Chisel is for engineers who want more control over AI-assisted coding.

Use it when you want to:

- Reduce chat-agent token usage across tools like Codex, Claude Code, GitHub Copilot, Cursor, Gemini, and similar AI coding tools.
- Avoid having an agent write a whole feature in one large pass.
- Keep the planning help from AI while still reviewing or writing the actual code yourself.
- Use inline completion only where the change is clear and local.
- Learn a codebase by seeing exactly where changes should happen, then implementing them by hand.
- Practice coding with AI as a guide instead of full autopilot.

Chisel is not only for people optimizing cost. It is also for people who enjoy coding, want to stay sharp, or want to learn by doing.

AI plans. You decide how the code gets written.

## v0.2 Capabilities

Chisel v0.2 works through provider instruction files plus local trust-layer commands. Marker placement still depends on how well the active agent follows those instructions.

- Plan-first workflow: agent creates a short implementation plan and asks for approval before editing.
- Marker insertion workflow: the agent is instructed to insert tiny language-native TODO comments at relevant code locations after approval.
- Stop-before-code rule: agent must not write the full implementation unless you explicitly leave Chisel mode.
- Inline completion handoff: you use Copilot or another inline completion tool at each marker.
- Hand-coding mode: you can ignore inline completion and implement each marker yourself, using Chisel as a guided map through the codebase.
- Session receipts: agent writes `.chisel/<session-id>.md` and `.chisel/<session-id>.json` with task, files touched, item order, skipped items, and cleanup marker.
- Deterministic status: `chisel status [session-id]` scans receipts and current repo markers.
- Safe cleanup command: `chisel cleanup <session-id>` previews exact marker removal, and `--apply` removes both lines of a standalone marker block containing `CHISEL:<session-id>`.
- Provider doctor: `chisel doctor --provider all` checks installed provider files and reports missing or stale files.
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
// CHISEL:20260704153000-a1b2c3 item-1
// TODO: Validate email format before submit.
// CHISEL:20260704153000-a1b2c3 item-2
// TODO: Show inline error message.
// CHISEL:20260704153000-a1b2c3 item-3
// TODO: Disable submit while invalid.
```

Now trigger inline completion at each marker, or implement by hand, review the diff, run tests, then remove markers containing `CHISEL:20260704153000-a1b2c3`.

Example marker inside `src/components/SignupForm.tsx`:

```tsx
function handleSubmit(event: FormEvent) {
  event.preventDefault();

  // CHISEL:20260704153000-a1b2c3 item-1
  // TODO: Validate email format before submit and return early with an inline error.

  submitForm();
}
```

## Workflow

1. Say: "Use Chisel for this task: add validation to the checkout form."
2. Agent writes a concise plan.
3. You approve the plan.
4. Agent inspects files and inserts paired `CHISEL:<session-id> item-N` and `TODO:` marker lines.
5. Agent stops before implementation.
6. You trigger inline completion at each marker or implement by hand.
7. You review the diff and run tests.
8. You inspect or clean the session with `chisel status` and `chisel cleanup`.

## Install

From the repo where you want Chisel active:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only codex
```

For all install options, providers, flags, uninstall steps, and manual copy commands, see [install.md](./install.md).

Session notes are local by default. Consider adding `.chisel/` to `.gitignore` unless your team wants to review Chisel receipts.

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

## Local Commands

Show active receipts and markers:

```bash
chisel status
chisel status 20260704153000-a1b2c3
```

Preview cleanup, then apply it:

```bash
chisel cleanup 20260704153000-a1b2c3
chisel cleanup 20260704153000-a1b2c3 --apply
```

Check installed provider files:

```bash
chisel doctor --provider all
```

`status` scans the repo literally. If your docs contain Chisel marker examples, those examples can appear as markers. `cleanup` removes paired standalone marker lines, and if a marker was appended to code on the same line it is skipped with a warning for manual cleanup.

## Troubleshooting

If an agent starts implementing code right after you approve the marker pass, that agent is ignoring the core Chisel rule. In Chisel, `yes` means "insert comments only", not "implement the feature".

Refresh the installed provider files in the target repo after upgrading Chisel:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only codex --force
```

Swap `codex` for the provider you are using.

## Marker Format

## Marker Format v2

Chisel now writes markers as a two-line block: a tracking line with the session and item id, followed immediately by a natural-language TODO line for inline-completion engines.

Old single-line markers still work with `chisel status` and `chisel cleanup`. New sessions should use the two-line format going forward.

TypeScript, JavaScript, Java, C#, Kotlin:

```ts
// CHISEL:<session-id> item-2
// TODO: Add email validation before submit.
```

Python, Shell, Ruby:

```py
# CHISEL:<session-id> item-2
# TODO: Add email validation before submit.
```

HTML:

```html
<!-- CHISEL:<session-id> item-2 -->
<!-- TODO: Add empty-state markup. -->
```

Good markers are local and concrete:

```tsx
// CHISEL:<session-id> item-4
// TODO: Replace flat card surface with subtle border, shadow, and pressed state styles.
```

Weak markers are too broad:

```tsx
// CHISEL:<session-id> item-4
// TODO: Improve card polish.
```

Each marker should guide one inline completion, usually 1-20 lines.

Every CHISEL marker must be on its own line. The tracking line and instruction line must be adjacent, with the instruction line immediately following the tracking line. Never append either line after code on the same line.

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

Chisel v0.2 is not a full CLI app. The included `chisel` command installs provider files, scans markers, reports status, cleans exact session markers, and checks provider install health. A future version can add deterministic marker insertion.

## What Chisel Is Not

- Not a replacement for Codex, Copilot, Claude Code, Cursor, or Gemini.
- Not a deterministic code generator in v0.
- Not a billing tracker.
- Not a guarantee that inline completion will produce correct code.
- Not a way to skip code review.

## Roadmap

- Safer merge behavior for existing provider instruction files.
- Optional code-mod based marker insertion.
- Agent behavior eval fixtures across real tasks.
