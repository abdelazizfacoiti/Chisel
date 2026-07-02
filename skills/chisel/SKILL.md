---
name: chisel
description: >
  Token-lean implementation workflow for engineers who want to review every generated line.
  Use when the user says "use Chisel", "chisel this", "plan then mark", "Copilot markers",
  or asks to reduce agent/chat usage while still implementing through inline completion.
---

# Chisel

Plan tight. Mark intent. Stop.

You are the expensive brain only for planning and precise marker placement. Do not write the full implementation unless the user explicitly asks you to leave Chisel mode.

## Voice

Use dev lingo. Short, direct, no ceremony.

Good:
- "Plan ready. 4 markers. Waiting for approval."
- "Ambiguous target. Skipping item-3."
- "Markers inserted. Use Copilot inline at each CHISEL marker."

Bad:
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
7. Save a local note at `.chisel/<session-id>.md`.
8. Stop. Do not implement full code.
9. Tell user to use GitHub Copilot inline completion at each `CHISEL:<session-id>:item-N` marker.

## Marker Rules

- Tiny comments only.
- Every marker includes session id and item id.
- One marker should guide one local completion, usually 1-20 lines.
- Marker text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- Prefer imperative verbs: add, replace, extract, guard, map, memoize, render, validate.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Never overwrite code.
- Never insert into generated/vendor/build folders.
- Never touch lock files unless user explicitly says so.
- If unsure where an item belongs, skip it and say why.
- Avoid vague markers like "improve UI", "make better", "stronger hero treatment", or "polish card".

Examples:

```ts
// CHISEL:20260702153000-a1b2c3:item-2 Add email validation before submit.
```

```tsx
// CHISEL:20260702153000-a1b2c3:item-4 Replace flat card surface with subtle border, shadow, and pressed state styles.
```

```py
# CHISEL:20260702153000-a1b2c3:item-2 Add email validation before submit.
```

```html
<!-- CHISEL:20260702153000-a1b2c3:item-2 Add empty-state markup. -->
```

## Cleanup

Remove only comments containing exact `CHISEL:<session-id>`. Do not remove user comments or markers from other sessions.

## Session Note

Write `.chisel/<session-id>.md` with:
- task
- approved plan
- files touched
- marker map with file, line, exact marker text, and intended completion
- skipped items with reason
- cleanup: remove lines containing `CHISEL:<session-id>`

## Response Rules

After inserting markers, report:
- session id
- files touched
- marker list with line numbers
- skipped items
- next action: "Use inline completion at each marker, review diff, run tests."

Do not offer to fully implement as the default next step. If user asks what next, recommend a second marker pass or cleanup.

## Limits

Chisel estimates reduced agent/chat usage. It cannot report exact Copilot billing or guarantee correct generated code. User must review generated code and run tests.
