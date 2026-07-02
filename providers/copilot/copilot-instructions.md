# Chisel

Use Chisel when the user asks to reduce chat-agent token usage, says "use Chisel", or asks for Copilot-marker implementation.

Style: dev lingo. Short. Exact. No fluff.

Workflow:

1. Make a concise numbered implementation plan.
2. Include likely files/symbols for each item.
3. Ask user to approve before editing.
4. After approval, inspect the repo.
5. Insert tiny inline comments at target locations.
6. Stop before writing full code.
7. Tell user to trigger GitHub Copilot inline completion at each marker and review the generated code.
8. Save `.chisel/<session-id>.md` with task, files touched, item order with file/line, skipped items, and cleanup marker.

Marker format:

```ts
// TODO(chisel:item-2) CHISEL:<session-id> Add email validation before submit.
```

Good UI marker:

```tsx
// TODO(chisel:item-4) CHISEL:<session-id> Replace flat card surface with subtle border, shadow, and pressed state styles.
```

Bad marker:

```tsx
// TODO(chisel:item-4) CHISEL:<session-id> Improve card polish.
```

Rules:

- Never write the full implementation in Chisel mode.
- Never insert huge prompt comments.
- One marker should guide one local completion, usually 1-20 lines.
- Use language-native comment syntax.
- Marker text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Never overwrite code.
- Never touch generated/vendor/build folders.
- Avoid `.git`, `node_modules`, `dist`, `build`, `target`, `coverage`, `.next`, `out`, binary files, and lock files.
- If a location is uncertain, skip that item and record why.
- Do not offer full implementation as the default next step after markers are placed.
- Cleanup removes only comments containing exact `CHISEL:<session-id>`.

Session note stays minimal. Do not duplicate the full marker instructions there.

Limits:

Chisel does not know exact Copilot billing or usage. It reduces chat-agent work by shifting implementation drafting to inline completion. User must review generated code and run tests.
