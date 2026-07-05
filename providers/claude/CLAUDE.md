Use Chisel when user says "use Chisel", "chisel this", "plan then mark", or asks to reduce agent/chat token usage by using inline completion.

Style: dev lingo. Short. Exact. No fluff.

Process:
1. Chisel has two phases: plan-only, then marker-pass-only.
2. Write concise numbered implementation plan and include likely files/symbols.
3. Group plan items by method using a shared-decision vs separable-concerns test so intended marker count is visible before approval.
4. If one method should get one cohesive marker, say that directly in the plan.
5. Ask: "Approve marker pass?"
6. Do not edit files before explicit approval.
7. Approval for the marker pass means comment insertion only. It is not approval to implement, polish, or enhance the feature.
8. Tiny mode max: 3 markers. Normal mode max: 8 markers. If more items remain, report `skipped: marker cap reached`.
9. After approval, inspect repo.
10. Insert tiny two-line CHISEL/TODO marker blocks at target locations using language-native comment syntax.
11. Save minimal `.chisel/<session-id>.md` and `.chisel/<session-id>.json` receipts with task, files touched, item order, skipped items, cleanup marker, and "markers only" status.
12. Run `chisel verify <session-id>` or the local equivalent and include the output before declaring the marker pass complete.
13. Stop before writing full code in the same turn.
14. Tell user to use inline completion or implement by hand at each marker.
15. Only use stage mode if the user explicitly asks to stage old code, and only keep the staged version if syntax check passes.

Marker quality:
- One marker guides one local completion, usually 1-20 lines.
- Every CHISEL marker must be on its own line. Never append a marker after code on the same line.
- Tracking line and instruction line must be adjacent, with the instruction line immediately following the tracking line.
- The instruction line must read as a complete TODO without needing the tracking line.
- Text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Avoid vague markers like "improve UI", "stronger hero treatment", or "polish card".
- Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object.
- Check for the same item or same `CHISEL:<session-id>` marker before inserting. Do not duplicate markers.
- Use one top-of-method marker for one shared design or behavior decision. Use multiple markers inside a method only when the concerns are genuinely separate.

Safety:
- No full implementation unless user exits Chisel mode.
- No large prompt comments.
- No generated/vendor/build folders.
- No lock files without explicit approval.
- If unsure, skip and record why.
- Do not offer full implementation as the default next step after markers are placed.
- Do not treat "yes" to the plan as approval to implement code.
- If `chisel verify <session-id>` reports FAIL, say so explicitly and do not claim the pass was clean.
- Never wrap already-commented code in another block comment.

Cleanup removes only comments containing exact `CHISEL:<session-id>`.

Comment syntax quick reference:
| Surface | Syntax |
|---|---|
| JS / TS / TSX / Go / Rust / Java | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
| Python / YAML | `# CHISEL:<session-id> item-N`<br>`# TODO: ...` |
| HTML / Vue template / Svelte markup | `<!-- CHISEL:<session-id> item-N -->`<br>`<!-- TODO: ... -->` |
| CSS / SCSS | `/* CHISEL:<session-id> item-N */`<br>`/* TODO: ... */` |
| SQL | `-- CHISEL:<session-id> item-N`<br>`-- TODO: ...` |
| Vue / Svelte `<script>` | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
