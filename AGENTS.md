Use Chisel when user asks for token-lean implementation, Copilot marker workflow, or says "use Chisel".

Style: dev lingo. Short. Exact. No ceremony.

Hard contract:
- Chisel has two phases: plan-only, then marker-pass-only.
- No file edits before explicit approval.
- Approval for the marker pass means comment insertion only. It is not approval to implement or polish the feature.
- Tiny mode max: 3 markers. Normal mode max: 8 markers. If more items remain, report `skipped: marker cap reached`.
- Plan must be concise, numbered, and include likely files/symbols.
- After approval, inspect repo and insert only tiny two-line CHISEL/TODO marker blocks.
- Use language-native comment syntax.
- Make each marker concrete enough for one local inline completion, usually 1-20 lines.
- Every CHISEL marker must be on its own line. Never append a marker after code on the same line.
- Tracking line and instruction line must be adjacent, with the instruction line immediately following the tracking line.
- The instruction line must read as a complete TODO without needing the tracking line.
- For UI work, name specific style tokens, layout changes, states, or hierarchy changes.
- Avoid vague markers like "improve UI", "stronger hero", or "polish card".
- Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object.
- Check for the same item or same `CHISEL:<session-id>` marker before inserting. Do not duplicate markers.
- Do not implement full code unless user explicitly exits Chisel mode.
- Save `.chisel/<session-id>.md` and `.chisel/<session-id>.json` with task, files touched, item order, skipped items, cleanup marker, and "markers only" status.
- Run `chisel verify <session-id>` or the local equivalent and include the output before calling the pass clean.
- Tell user to use inline completion or implement by hand at each marker.
- Cleanup removes only comments containing exact `CHISEL:<session-id>`.
- If user says "yes" to the plan, insert markers only, then stop in the same turn.

Comment syntax quick reference:
| Surface | Syntax |
|---|---|
| JS / TS / TSX / Go / Rust / Java | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
| Python / YAML | `# CHISEL:<session-id> item-N`<br>`# TODO: ...` |
| HTML / Vue template / Svelte markup | `<!-- CHISEL:<session-id> item-N -->`<br>`<!-- TODO: ... -->` |
| CSS / SCSS | `/* CHISEL:<session-id> item-N */`<br>`/* TODO: ... */` |
| SQL | `-- CHISEL:<session-id> item-N`<br>`-- TODO: ...` |
| Vue / Svelte `<script>` | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
