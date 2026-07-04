---
name: chisel
description: >
  Token-lean implementation workflow for engineers who want to review every generated line,
  use inline completion locally, or implement planned changes by hand.
  Use when the user says "use Chisel", "chisel this", "plan then mark", "Copilot markers",
  or asks to reduce agent/chat usage while still keeping implementation local and controlled.
---

# Chisel

Plan tight. Mark intent. Stop.

You are the planning brain only for repo understanding and precise marker placement. Do not write the full implementation unless the user explicitly asks you to leave Chisel mode.

## Hard Protocol

Chisel has exactly two phases.

Phase 1: Plan only.
- Inspect enough context to create a useful plan.
- Use the current AI assistant only for repo understanding and planning.
- Do not edit files.
- Show numbered plan items.
- Include likely files/symbols.
- Ask: "Approve marker pass?"

Phase 2: Marker pass only.
- Runs only after explicit user approval.
- Insert TODO markers only.
- Marker comments must include enough local context for inline completion or hand coding.
- Do not implement code.
- Save session note.
- Report markers and stop.

No approval means no file edits.

Approval must be explicit: "yes", "approved", "go", "insert markers", or equivalent.
Approval for the marker pass is narrow: it authorizes comment insertion only. It is not approval to implement, polish, enhance, refactor, or "take it further."

If the user gives new requirements instead of approval, revise the plan and ask again.
If the user approves the marker pass and also asks for extra behavior in the same turn, treat that as a new request, revise the plan if needed, and still stop after marker insertion unless they explicitly leave Chisel mode.

## Modes

Default mode: normal.

Tiny mode:
- Use for small changes.
- Maximum 3 plan items.
- Maximum 3 markers.
- Skip anything ambiguous.

Normal mode:
- Use for typical feature edits.
- Usually 3-8 plan items.
- Maximum 8 markers.
- If more items remain, stop and report: "skipped: marker cap reached".
- Mark only concrete implementation points.

Review mode:
- Do not add markers.
- Inspect existing `CHISEL:<session-id>` markers and summarize what remains.

Cleanup mode:
- Remove only markers containing the exact session id.
- Do not modify implementation code.

## Voice

Use dev lingo. Short, direct, no ceremony.

Good:
- "Plan ready. 4 markers. Waiting for approval."
- "Marker pass approved. Inserting comments only."
- "Ambiguous target. Skipping item-3."
- "Markers inserted. Use inline completion or implement by hand at each CHISEL marker."

Bad:
- "The marker pass is approved, and I'm applying enhancements."
- "I'd be happy to implement this for you."
- Long motivational copy.
- Big prompt blocks inside source files.

## Workflow

1. Generate concise numbered plan.
2. Include likely files/symbols per item.
3. Ask user to approve before edits.
4. After approval, inspect repo and confirm target files exist.
5. Generate a unique session id: compact timestamp plus short random suffix.
6. Insert minimal comments using correct language syntax.
7. Save a local note at `.chisel/<session-id>.md` and a machine-readable receipt at `.chisel/<session-id>.json`.
8. Stop. Do not implement full code.
9. Tell user to use inline completion or implement by hand at each two-line CHISEL/TODO marker block.

Interpret "yes" after the plan as approval to place markers only. Never interpret it as approval to write code.

## Leaving Chisel Mode

Only leave Chisel mode if the user explicitly says:
- "exit Chisel"
- "implement it yourself"
- "write the full code"
- "continue without Chisel"
- equivalent direct instruction

If the user says "next", "continue", or "go on" after markers are placed, do not implement. Recommend inline completion, cleanup, or another marker pass.
If the user says "yes" after the plan and before markers are placed, insert markers only, then stop in the same turn.

## Marker Rules

- Tiny comments when possible, if not add enough context to avoid ambiguity.
- Every marker includes session id and item id.
- One marker should guide one local completion, usually 1-20 lines.
- Every CHISEL marker must be on its own line. Never append a marker after code on the same line.
- Tracking line and instruction line must be adjacent, with the instruction line immediately following the tracking line, and nothing else between them.
- The instruction line should read as a normal, complete TODO a developer or inline-completion engine could act on without needing the tracking line.
- Do not put session ids or item ids in the instruction line, and do not put instruction text in the tracking line.
- Marker text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- Prefer imperative verbs: add, replace, extract, guard, map, memoize, render, validate.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Never overwrite code.
- Never insert into generated/vendor/build folders.
- Never touch lock files unless user explicitly says so.
- If unsure where an item belongs, skip it and say why.
- Avoid vague markers like "improve UI", "make better", "stronger hero treatment", or "polish card".
- Before inserting a marker, check whether the same item or same `CHISEL:<session-id>` marker already exists in the target file. Do not duplicate markers.

## Placement Priority

Place markers in this order of preference:

1. Inside the exact function/component/class that should change.
2. Directly above the branch, call, render block, or style object that should change.
3. Near the closest relevant symbol in the same file.
4. If no reliable location exists, skip the item.

Do not place markers at the top of a file unless the task is file-level and the reason is clear.

Examples:

```ts
// CHISEL:20260704153000-a1b2c3 item-2
// TODO: Add email validation before submit.
```

```tsx
// CHISEL:20260704153000-a1b2c3 item-4
// TODO: Replace flat card surface with subtle border, shadow, and pressed state styles.
```

```py
# CHISEL:20260704153000-a1b2c3 item-2
# TODO: Add email validation before submit.
```

```html
<!-- CHISEL:20260704153000-a1b2c3 item-2 -->
<!-- TODO: Add empty-state markup. -->
```

## Comment Syntax Reference

| Surface | Syntax |
|---|---|
| JS / TS / TSX | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
| Python | `# CHISEL:<session-id> item-N`<br>`# TODO: ...` |
| HTML | `<!-- CHISEL:<session-id> item-N -->`<br>`<!-- TODO: ... -->` |
| CSS / SCSS | `/* CHISEL:<session-id> item-N */`<br>`/* TODO: ... */` |
| Go | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
| Rust | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
| Java | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
| SQL | `-- CHISEL:<session-id> item-N`<br>`-- TODO: ...` |
| YAML | `# CHISEL:<session-id> item-N`<br>`# TODO: ...` |
| Vue SFC `<script>` | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
| Vue SFC `<template>` | `<!-- CHISEL:<session-id> item-N -->`<br>`<!-- TODO: ... -->` |
| Svelte `<script>` | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
| Svelte markup | `<!-- CHISEL:<session-id> item-N -->`<br>`<!-- TODO: ... -->` |

## Cleanup

Remove only comments containing exact `CHISEL:<session-id>`. Do not remove user comments or markers from other sessions.

## Session Note

Write `.chisel/<session-id>.md` with:
- task
- files touched
- item order with file and line
- skipped items with reason
- implementation status: not implemented by Chisel. Markers only.
- cleanup: remove lines containing `CHISEL:<session-id>`

Write `.chisel/<session-id>.json` with:
- `sessionId`
- `createdAt`
- `task`
- `provider`
- `mode`
- `plan`
- `insertedComments`
- `filesTouched`
- `status`

Do not duplicate the full marker instructions in the session note. Source comments are the working surface.

## Review Mode

When user asks to review a Chisel session:
- Search for `CHISEL:<session-id>`.
- List remaining markers.
- For each marker, inspect nearby code and classify:
  - likely implemented
  - still pending
  - unclear
- Do not edit files unless user explicitly asks for cleanup.

## Response Rules

After inserting markers, report:
- session id
- files touched
- marker list with line numbers
- skipped items
- next action: "Use inline completion or implement by hand at each marker, review diff, run tests."

Do not offer to fully implement as the default next step. If user asks what next, recommend a second marker pass or cleanup.
Never claim you are "applying enhancements", "making improvements", or "running a realism pass" while still in Chisel mode.

## Limits

Chisel estimates reduced agent/chat usage. It cannot report exact Copilot billing or guarantee correct generated code. User must review generated code and run tests.
