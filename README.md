# Chisel

[![CI](https://github.com/abdelazizfacoiti/Chisel/actions/workflows/ci.yml/badge.svg)](https://github.com/abdelazizfacoiti/Chisel/actions/workflows/ci.yml)

<p align="center">
  <img src="./assets/chisel-logo.png" alt="Chisel logo" width="360">
</p>

Plan tight. Mark intent. Let inline completion draft. Review every line.

## Quickstart

```bash
npx -y github:abdelazizfacoiti/Chisel -- install --only <your-tool>
```

Then just talk to your AI coding tool normally: "use Chisel for this task: <what you want>." Say "yes" to approve the plan - that only inserts TODO markers, it does not write the feature. Implement each marker yourself or with inline completion, then run `chisel cleanup` when you're done.

Chisel is an instruction and command pack for AI coding tools. It helps engineers use fewer chat-agent tokens and keep more control by moving from "agent writes the whole feature" to "agent plans, places precise TODO markers, then stops."

The chat agent does the high-leverage work: understand the task, inspect the repo, produce a small plan, and place concrete inline markers. GitHub Copilot or another inline completion engine can draft from those markers, or you can implement them by hand. You review every generated line either way.

Chisel writes markers through a deterministic anchor-based CLI. Your agent proposes the file, anchor, and instruction; `chisel insert` performs the write, records the diff hunk, and stages the marker change when the repo uses git.

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

Approve marker pass? (this only places comments, not code)
```

After approval, the agent should place markers near the relevant code:

```ts
// CHISEL:add-email-validation item-1
// TODO: Validate email format before submit.
// CHISEL:add-email-validation item-2
// TODO: Show inline error message.
// CHISEL:add-email-validation item-3
// TODO: Disable submit while invalid.
```

Now trigger inline completion at each marker, or implement by hand, review the diff, run tests, then remove markers containing `CHISEL:add-email-validation`.

Example marker inside `src/components/SignupForm.tsx`:

```tsx
function handleSubmit(event: FormEvent) {
  event.preventDefault();

  // CHISEL:add-email-validation item-1
  // TODO: Validate email format before submit and return early with an inline error.

  submitForm();
}
```

## Install

From the repo where you want Chisel active:

```bash
npx -y github:abdelazizfacoiti/Chisel -- install --only codex
```

For all install options, providers, flags, uninstall steps, and manual copy commands, see [install.md](./install.md).

Session notes are local by default. Consider adding `.chisel/` to `.gitignore` unless your team wants to review Chisel receipts.

## Workflow

1. Say: "Use Chisel for this task: add validation to the checkout form."
2. Agent writes a concise plan.
3. You approve the plan.
4. Agent inspects files and calls `chisel insert` once per marker, using a unique existing anchor line.
5. Agent runs `chisel verify <slug>` and shows the result before calling the pass clean.
6. Agent stops before implementation.
7. You trigger inline completion at each marker or implement by hand.
8. You review the diff and run tests.
9. You inspect or clean the session with `chisel status`, `chisel verify`, and `chisel cleanup`.

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

## v0.3 Capabilities

Chisel v0.3 works through provider instruction files plus deterministic local commands. Marker placement is written by `chisel insert`, not by freehand model edits.

Tiny vs normal marker passes are chosen automatically based on task size; you do not need to ask for either one by name. The only user-triggered mode switches are explicit requests like "review this session", "clean up", or "stage the old code".

- Plan-first workflow: agent creates a short implementation plan and asks for approval before editing.
- Marker insertion workflow: the agent calls `chisel insert` with a unique anchor; the CLI inserts tiny language-native TODO comments after approval.
- Stop-before-code rule: agent must not write the full implementation unless you explicitly leave Chisel mode.
- Inline completion handoff: you use Copilot or another inline completion tool at each marker.
- Hand-coding mode: you can ignore inline completion and implement each marker yourself, using Chisel as a guided map through the codebase.
- Lightweight manifests: Chisel writes `.chisel/<slug>.json` with task, item order, anchors, and diff hunks.
- Deterministic status: `chisel status [slug]` scans receipts and current repo markers.
- Deterministic per-pass audit: `chisel verify <slug>` checks recorded marker hunks against git diff and runs best-effort syntax checks.
- Safe cleanup command: `chisel cleanup <slug>` previews reversal of recorded marker hunks, and `--apply` removes them.
- Opt-in stage mode: if you explicitly ask to stage old code, Chisel can comment out a replaceable block safely and `cleanup` restores it by default.
- Provider doctor: `chisel doctor --provider all` checks installed provider files and reports missing or stale files.
- Provider install pack: installer can drop the right instruction/command files for Codex, GitHub Copilot, Claude Code, Gemini, Cursor, and opencode.
- Codex plugin metadata: `.codex-plugin/plugin.json` is included for packaging Chisel as an installable Codex plugin later.

## Provider Support

| Tool | Installed files | How to invoke | Guarantee level |
|---|---|---|---|
| Codex | `AGENTS.md`, `.codex/config.toml`, `.codex/prompts/chisel.md`, `.codex-plugin/plugin.json`, `.agents/skills/chisel/SKILL.md` | `"Use Chisel for this task: ..."` | Audited: `verify` checks marker-only behavior after the pass |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/prompts/chisel.prompt.md` | `"Use Chisel for this task: ..."` | Audited: `verify` checks marker-only behavior after the pass |
| Claude Code | `CLAUDE.md`, `.claude/commands/chisel.md`, `.claude/hooks/chisel-guard.js`, `.claude/settings.json` hook registration | `"Use Chisel for this task: ..."` | Enforced: PreToolUse hook blocks direct edits to active-pass files |
| Gemini CLI | `GEMINI.md` | `"Use Chisel for this task: ..."` | Audited: `verify` checks marker-only behavior after the pass |
| Cursor | `.cursor/rules/chisel.mdc` | `"Use Chisel for this task: ..."` | Audited: `verify` checks marker-only behavior after the pass |
| opencode | `.opencode/AGENTS.md` | `"Use Chisel for this task: ..."` | Audited: `verify` checks marker-only behavior after the pass |

Shortcuts where supported: `/chisel <task>` in Claude Code and Codex (if repo prompts are surfaced), `$chisel` and `/skills` in Codex, `chisel.prompt.md` in the Copilot picker.

Claude Code is different from the other providers: its hook provides mechanical enforcement during an active pass. Other providers still use deterministic insertion and post-hoc audit, but they do not have a live edit-blocking hook.

Advanced provider notes, prompt-path details, and compatibility notes live in [docs/ADVANCED.md](./docs/ADVANCED.md).

## Local Commands

If `chisel` is not on PATH, run the same commands through GitHub npx, for example `npx -y github:abdelazizfacoiti/Chisel -- status`.

Show active receipts and markers:

```bash
chisel status
```

If you have more than one pass, pass the slug explicitly:

```bash
chisel status add-email-validation
```

Audit a marker pass deterministically:

```bash
chisel verify
```

If you have more than one pass, pass the slug explicitly:

```bash
chisel verify add-email-validation
```

Preview cleanup, then apply it:

```bash
chisel cleanup
chisel cleanup --apply
```

If you have more than one pass, pass the slug explicitly:

```bash
chisel cleanup add-email-validation
chisel cleanup add-email-validation --apply
```

If you explicitly asked Chisel to stage old code, `chisel cleanup <slug>` restores the staged block by default. Pass `--discard-staged` only when you want the staged old code deleted instead of restored.

Advanced: opt-in stage mode for replacing existing code is documented in [docs/ADVANCED.md](./docs/ADVANCED.md).

Check installed provider files:

```bash
chisel doctor --provider all
```

`status` scans the repo literally. If your docs contain Chisel marker examples, those examples can appear as markers. `verify` is the per-session audit command. `npm run verify` is the repo's own test/check script. `cleanup` removes paired standalone marker lines, and if a marker was appended to code on the same line it is skipped with a warning for manual cleanup.

## Marker Format

Chisel writes markers as a two-line block: a tracking line with the slug and item id, followed immediately by a natural-language TODO line for inline-completion engines.

TypeScript, JavaScript, Java, C#, Kotlin:

```ts
// CHISEL:<slug> item-2
// TODO: Add email validation before submit.
```

Python, Shell, Ruby:

```py
# CHISEL:<slug> item-2
# TODO: Add email validation before submit.
```

HTML:

```html
<!-- CHISEL:<slug> item-2 -->
<!-- TODO: Add empty-state markup. -->
```

Good markers are local and concrete:

```tsx
// CHISEL:<slug> item-4
// TODO: Replace flat card surface with subtle border, shadow, and pressed state styles.
```

Weak markers are too broad:

```tsx
// CHISEL:<slug> item-4
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

## Status

Chisel is currently v0.3: an instruction and command pack with a deterministic local trust layer.

It uses `chisel insert` for deterministic marker insertion, records manifest diff hunks, and provides local scan, status, verify, cleanup, and install health checks.

## Troubleshooting

If an agent starts implementing code right after you approve the marker pass, that agent is ignoring the core Chisel rule. In Chisel, `yes` means "insert comments only", not "implement the feature".

Refresh the installed provider files in the target repo after upgrading Chisel:

```bash
npx -y github:abdelazizfacoiti/Chisel -- install --only codex --force
```

Swap `codex` for the provider you are using.

## When Not To Use Chisel

Do not use Chisel for:

- Tiny one-line fixes.
- Tasks where you already know the exact implementation.
- Security-sensitive code where marker-driven completion may miss edge cases.
- Large refactors that need continuous architectural reasoning.
- Generated files, migrations, lock files, or vendored code unless explicitly approved.

## Limits

Chisel does not know exact Copilot usage or billing. It should not claim exact savings. It reduces expensive chat-agent usage by shifting implementation drafting to inline completion.

Chisel v0.3 includes deterministic marker insertion, marker-pass manifests, status, verify, cleanup, scan, and provider install health checks.

## What Chisel Is Not

- Not a replacement for Codex, Copilot, Claude Code, Cursor, or Gemini.
- Not a deterministic code generator in v0.
- Not a billing tracker.
- Not a guarantee that inline completion will produce correct code.
- Not a way to skip code review.

## Contributing

Contributor docs live in [CONTRIBUTING.md](./CONTRIBUTING.md). Version history lives in [CHANGELOG.md](./CHANGELOG.md).
Advanced workflow and provider notes live in [docs/ADVANCED.md](./docs/ADVANCED.md).

## Roadmap

- Safer merge behavior for existing provider instruction files.
- Optional code-mod based marker insertion.
- Agent behavior eval fixtures across real tasks.
