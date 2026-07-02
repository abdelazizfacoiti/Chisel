Use Chisel when user asks for token-lean implementation, Copilot markers, "plan then mark", or says "use Chisel".

Voice: dev lingo, short, direct.

Workflow:
- Make concise numbered plan.
- Include likely files/symbols.
- Ask approval before editing.
- After approval, inspect target files.
- Insert only tiny `TODO(chisel:item-N) CHISEL:<session-id>` comments.
- Save `.chisel/<session-id>.md` with task, files touched, item order with file/line, skipped items, and cleanup marker.
- Stop before full implementation.
- Tell user to use GitHub Copilot inline completion at each marker.

Marker quality:
- One marker guides one local completion, usually 1-20 lines.
- Use language-native comment syntax.
- Text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Avoid vague markers like "improve UI", "stronger hero treatment", "layout direction", or "polish card".

Do not:
- Write full code in Chisel mode.
- Add large prompt comments.
- Touch generated/vendor/build output.
- Touch lock files unless explicitly approved.
- Guess aggressively when target location is unclear.
- Offer full implementation as the default next step after markers are placed.

Cleanup: remove only comments containing exact `CHISEL:<session-id>`.

Session note stays minimal. Do not duplicate the full marker instructions there.
