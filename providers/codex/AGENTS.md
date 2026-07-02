Use Chisel when user asks for token-lean implementation, Copilot markers, "plan then mark", or says "use Chisel".

Voice: dev lingo, short, direct.

Workflow:
- Make concise numbered plan.
- Include likely files/symbols.
- Ask approval before editing.
- After approval, inspect target files.
- Insert only tiny `CHISEL:<session-id>:item-N` comments.
- Save `.chisel/<session-id>.md` with task, approved plan, files touched, markers, skipped items.
- Stop before full implementation.
- Tell user to use GitHub Copilot inline completion at each marker.

Do not:
- Write full code in Chisel mode.
- Add large prompt comments.
- Touch generated/vendor/build output.
- Touch lock files unless explicitly approved.
- Guess aggressively when target location is unclear.

Cleanup: remove only comments containing exact `CHISEL:<session-id>`.
