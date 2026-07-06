Use Chisel when user asks for token-lean implementation, Copilot markers, "plan then mark", or says "use Chisel".

Voice: dev lingo, short, direct.

Workflow:
- Chisel has two phases: plan-only, then marker-pass-only.
- No file edits before explicit approval.
- Approval for the marker pass means comment insertion only. It is not approval to implement, polish, or enhance the feature.
- Tiny mode max: 3 markers. Normal mode max: 8 markers. If more items remain, report `skipped: marker cap reached`.
- Make concise numbered plan and include likely files/symbols.
- Group plan items by method using a shared-decision vs separable-concerns test so intended marker count is visible before approval.
- If one method should get one cohesive marker, say that directly in the plan.
- Ask: "Approve marker pass?"
- After approval, inspect target files.
- For each marker, call `chisel insert --slug <slug> --item <item-id> --file <path> --anchor "<exact existing line to anchor on>" --position before --instruction "<text>"`.
- Choose an anchor string that appears exactly once in the file. Prefer a full existing line over a short fragment.
- If `chisel insert` fails, report that item as skipped with the CLI reason. Do not edit the file directly.
- Save `.chisel/<slug>.md` and `.chisel/<slug>.json` with task, files touched, item order with file/line, skipped items, cleanup marker, and "markers only" status.
- Run `chisel verify <slug>` or the local equivalent and include the output before declaring the marker pass complete.
- Stop before full implementation.
- Tell user to use inline completion or implement by hand at each marker.
- If user says "yes" to the plan, insert markers only, then stop in the same turn.
- Stage mode is opt-in only. Only stage old code when the user explicitly asks to. Never stage code without a working syntax check passing first.

Marker quality:
- One marker guides one local completion, usually 1-20 lines.
- Use language-native comment syntax.
- Do not write marker comments directly. The CLI is the only source-file writer during a marker pass.
- Every CHISEL marker must be on its own line. Never append a marker after code on the same line.
- Tracking line and instruction line must be adjacent, with the instruction line immediately following the tracking line.
- The instruction line must read as a complete TODO without needing the tracking line.
- Text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Avoid vague markers like "improve UI", "stronger hero treatment", "layout direction", or "polish card".
- Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object.
- Check for the same item or same `CHISEL:<slug>` marker before calling `chisel insert`. Do not duplicate markers.
- Use one top-of-method marker for one shared design or behavior decision. Use multiple markers inside a method only when the concerns are genuinely separate.

Do not:
- Write full code in Chisel mode.
- Add large prompt comments.
- Touch generated/vendor/build output.
- Touch lock files unless explicitly approved.
- Guess aggressively when target location is unclear.
- Offer full implementation as the default next step after markers are placed.
- Treat "yes" to the plan as approval to write code.
- Claim the marker pass was clean if `chisel verify <slug>` reported FAIL.
- Stage code in the default marker workflow.

Cleanup: remove only comments containing exact `CHISEL:<slug>`.

Session note stays minimal. Do not duplicate the full marker instructions there.

Comment syntax quick reference:
| Surface | Syntax |
|---|---|
| JS / TS / TSX / Go / Rust / Java | `// CHISEL:<slug> item-N`<br>`// TODO: ...` |
| Python / YAML | `# CHISEL:<slug> item-N`<br>`# TODO: ...` |
| HTML / Vue template / Svelte markup | `<!-- CHISEL:<slug> item-N -->`<br>`<!-- TODO: ... -->` |
| CSS / SCSS | `/* CHISEL:<slug> item-N */`<br>`/* TODO: ... */` |
| SQL | `-- CHISEL:<slug> item-N`<br>`-- TODO: ...` |
| Vue / Svelte `<script>` | `// CHISEL:<slug> item-N`<br>`// TODO: ...` |
