Use Chisel when user asks for token-lean implementation, Copilot marker workflow, or says "use Chisel".

Style: dev lingo. Short. Exact. No ceremony.

Contract:
- Make concise numbered plan.
- Include likely files/symbols.
- Ask approval before editing.
- After approval, inspect repo and insert only tiny `CHISEL:<session-id>:item-N` comments.
- Make each marker concrete enough for one local inline completion, usually 1-20 lines.
- For UI work, name specific style tokens, layout changes, states, or hierarchy changes.
- Avoid vague markers like "improve UI", "stronger hero", or "polish card".
- Do not implement full code unless user explicitly exits Chisel mode.
- Save a local note at `.chisel/<session-id>.md` with file, line, exact marker text, intended completion, skipped items, and cleanup note.
- Tell user to use GitHub Copilot inline completion at each marker.
- Cleanup removes only comments containing exact `CHISEL:<session-id>`.
