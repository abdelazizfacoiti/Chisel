Use Chisel when user says "use Chisel", "chisel this", "plan then mark", or asks to reduce agent/chat token usage by using inline completion.

Style: dev lingo. Short. Exact. No fluff.

Claude Code enforcement: this provider installs `.claude/hooks/chisel-guard.js` and registers it as a PreToolUse hook. During an active Chisel pass, direct Edit/Write/MultiEdit calls to files listed in the pass manifest are mechanically denied; use `chisel insert` to place markers.

Process:
1. Chisel has two phases: plan-only, then marker-pass-only.
2. Write concise numbered implementation plan and include likely files/symbols.
3. Group plan items by method using a shared-decision vs separable-concerns test so intended marker count is visible before approval.
4. If one method should get one cohesive marker, say that directly in the plan.
5. Ask: "Approve marker pass?"
6. Do not edit files before explicit approval.
7. Approval for the marker pass means comment insertion only. It is not approval to implement, polish, or enhance the feature.
8. Tiny mode max: 3 markers. Normal mode max: 8 markers. If more items remain, report `skipped: marker cap reached`.
9. After approval, run `chisel pass start <slug> --task "<task>"`, then inspect repo.
10. For each marker, call `chisel insert --slug <slug> --item <item-id> --file <path> --anchor "<exact existing line to anchor on>" --position before --instruction "<text>"`.
11. Choose an anchor string that appears exactly once in the file. Prefer a full existing line over a short fragment.
12. If `chisel insert` fails, report that item as skipped with the CLI reason. Do not edit the file directly.
13. Save minimal `.chisel/<slug>.md` and `.chisel/<slug>.json` receipts with task, files touched, item order, skipped items, cleanup marker, and "markers only" status.
14. Run `chisel verify <slug>` or the local equivalent and include the output before declaring the marker pass complete, then run `chisel pass end <slug>`.
15. Stop before writing full code in the same turn.
16. Tell user to use inline completion or implement by hand at each marker.
17. Only use stage mode if the user explicitly asks to stage old code, and only keep the staged version if syntax check passes.

Marker quality:
- One marker guides one local completion, usually 1-20 lines.
- Do not write marker comments directly. The CLI is the only source-file writer during a marker pass.
- Every CHISEL marker must be on its own line. Never append a marker after code on the same line.
- Tracking line and instruction line must be adjacent, with the instruction line immediately following the tracking line.
- The instruction line must read as a complete TODO without needing the tracking line.
- Text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Avoid vague markers like "improve UI", "stronger hero treatment", or "polish card".
- Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object.
- Check for the same item or same `CHISEL:<slug>` marker before calling `chisel insert`. Do not duplicate markers.
- Use one top-of-method marker for one shared design or behavior decision. Use multiple markers inside a method only when the concerns are genuinely separate.

Safety:
- No full implementation unless user exits Chisel mode.
- No large prompt comments.
- No generated/vendor/build folders.
- No lock files without explicit approval.
- If unsure, skip and record why.
- Do not offer full implementation as the default next step after markers are placed.
- Do not treat "yes" to the plan as approval to implement code.
- If `chisel verify <slug>` reports FAIL, say so explicitly and do not claim the pass was clean.
- Never wrap already-commented code in another block comment.

Cleanup removes only comments containing exact `CHISEL:<slug>`.

Comment syntax quick reference:
| Surface | Syntax |
|---|---|
| JS / TS / TSX / Go / Rust / Java | `// CHISEL:<slug> item-N`<br>`// TODO: ...` |
| Python / YAML | `# CHISEL:<slug> item-N`<br>`# TODO: ...` |
| HTML / Vue template / Svelte markup | `<!-- CHISEL:<slug> item-N -->`<br>`<!-- TODO: ... -->` |
| CSS / SCSS | `/* CHISEL:<slug> item-N */`<br>`/* TODO: ... */` |
| SQL | `-- CHISEL:<slug> item-N`<br>`-- TODO: ...` |
| Vue / Svelte `<script>` | `// CHISEL:<slug> item-N`<br>`// TODO: ...` |
