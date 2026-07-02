Use Chisel when user asks for token-lean implementation, Copilot markers, "plan then mark", or says "use Chisel".

Voice: dev lingo, short, direct.

Workflow:
- Make concise numbered plan.
- Include likely files/symbols.
- Ask approval before editing.
- After approval, inspect target files.
- Insert only tiny `CHISEL:<session-id>:item-N` comments.
- Save `.chisel/<session-id>.md` with task, approved plan, files touched, marker map, skipped items, and cleanup note.
- Stop before full implementation.
- Tell user to use GitHub Copilot inline completion at each marker.

Marker quality:
- One marker guides one local completion, usually 1-20 lines.
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

Session note marker map must include file, line, exact marker text, and intended completion.
