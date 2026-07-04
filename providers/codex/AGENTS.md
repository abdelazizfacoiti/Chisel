Use Chisel when user asks for token-lean implementation, Copilot markers, "plan then mark", or says "use Chisel".

Voice: dev lingo, short, direct.

Workflow:
- Chisel has two phases: plan-only, then marker-pass-only.
- No file edits before explicit approval.
- Make concise numbered plan and include likely files/symbols.
- Ask: "Approve marker pass?"
- After approval, inspect target files.
- Insert only tiny `TODO(chisel:item-N) CHISEL:<session-id>` comments.
- Save `.chisel/<session-id>.md` and `.chisel/<session-id>.json` with task, files touched, item order with file/line, skipped items, cleanup marker, and "markers only" status.
- Stop before full implementation.
- Tell user to use inline completion or implement by hand at each marker.

Marker quality:
- One marker guides one local completion, usually 1-20 lines.
- Use language-native comment syntax.
- Text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Avoid vague markers like "improve UI", "stronger hero treatment", "layout direction", or "polish card".
- Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object.
- Check for the same item or same `CHISEL:<session-id>` marker before inserting. Do not duplicate markers.

Do not:
- Write full code in Chisel mode.
- Add large prompt comments.
- Touch generated/vendor/build output.
- Touch lock files unless explicitly approved.
- Guess aggressively when target location is unclear.
- Offer full implementation as the default next step after markers are placed.

Cleanup: remove only comments containing exact `CHISEL:<session-id>`.

Session note stays minimal. Do not duplicate the full marker instructions there.
