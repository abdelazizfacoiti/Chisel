# Chisel

Plan tight. Mark intent. Let inline completion draft. Review every line.

Chisel is an instruction pack for coding agents and editor AI extensions. It is for engineers who want lower chat-agent token spend without handing the repo to autopilot.

The expensive agent does the part worth paying for: understand the task, inspect the repo, produce a small plan, and place precise inline markers. GitHub Copilot or another inline completion engine drafts the implementation from those markers. You stay in the loop.

## What It Does

1. User says: "Use Chisel for this task: add validation to the checkout form."
2. Agent writes a concise implementation plan.
3. Agent asks for approval before touching files.
4. Agent inserts tiny `CHISEL` comments at the right locations.
5. Agent stops before writing the full implementation.
6. User runs inline completion at each marker and reviews the code.
7. User removes markers after the implementation is done.

## App Or Instruction Pack?

Instruction pack first. App later.

The best v0 lives where developers already ask for code: Codex, Claude Code, GitHub Copilot, Gemini, Cursor, and similar tools. A CLI can help later with session tracking and cleanup, but the first useful version is portable workflow behavior that existing agents can follow today.

## Install Into A Repo

Fast path with npx after this repo is pushed to GitHub:

```bash
npx -y github:<your-github-user-or-org>/Chisel -- --only codex
npx -y github:<your-github-user-or-org>/Chisel -- --only copilot
```

Copy the provider file for your tool into the target project:

| Tool | File to copy |
|---|---|
| GitHub Copilot | `.github/copilot-instructions.md` and `.github/prompts/chisel.prompt.md` |
| Codex | `AGENTS.md` and `.agents/skills/chisel/SKILL.md` |
| Claude Code | `CLAUDE.md` and `.claude/commands/chisel.md` |
| Gemini CLI | `GEMINI.md` |
| Cursor | `.cursor/rules/chisel.mdc` |
| opencode | `.opencode/AGENTS.md` |

Ready-to-copy versions live under `providers/`.

## Slash Commands

Chisel installs `/chisel` where the assistant supports repo-local command files:

- GitHub Copilot in VS Code: `.github/prompts/chisel.prompt.md`
- Claude Code: `.claude/commands/chisel.md`

Codex uses skills for reusable workflows. After installing the Codex target, invoke Chisel with `$chisel`, pick it from `/skills`, or say "use Chisel". Codex custom prompts are deprecated and user-local; `--with-codex-prompt` can add `~/.codex/prompts/chisel.md`, which appears as `/prompts:chisel` after restart.

Cursor, Gemini, and opencode get always-on instruction files in this v0. They can still use the phrase "use Chisel", but this pack does not claim a native `/chisel` command there yet.

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

## Session Notes

For v0, the agent keeps a small local note at:

```text
.chisel/<session-id>.md
```

That note should list:

- task
- files touched
- item order with file and line
- skipped items
- cleanup marker

## Safety Rules

- Do not write the full implementation in Chisel mode.
- Do not insert large prompt comments.
- Do not overwrite existing code.
- Do not touch generated/vendor/build output.
- Do not touch lock files unless the user explicitly approves it.
- If target location is unclear, skip the marker and say why.
- Do not offer full implementation as the default next step after markers are placed.
- User must review generated code and run tests.

## Limits

Chisel does not know exact Copilot usage or billing. It should not claim exact savings. It reduces expensive chat-agent usage by moving boilerplate drafting to inline completion.
