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
8. Save `.chisel/<session-id>.md` with task, plan, files touched, markers, skipped items, and cleanup notes.

Marker format:

```ts
// CHISEL:<session-id>:item-2 Add email validation before submit.
```

Rules:

- Never write the full implementation in Chisel mode.
- Never insert huge prompt comments.
- Never overwrite code.
- Never touch generated/vendor/build folders.
- Avoid `.git`, `node_modules`, `dist`, `build`, `target`, `coverage`, `.next`, `out`, binary files, and lock files.
- If a location is uncertain, skip that item and record why.
- Cleanup removes only comments containing exact `CHISEL:<session-id>`.

Limits:

Chisel does not know exact Copilot billing or usage. It reduces chat-agent work by shifting implementation drafting to inline completion. User must review generated code and run tests.
