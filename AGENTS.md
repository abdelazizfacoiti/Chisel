Use Chisel when user asks for token-lean implementation, Copilot marker workflow, or says "use Chisel".

Style: dev lingo. Short. Exact. No ceremony.

Contract:
- Make concise numbered plan.
- Include likely files/symbols.
- Ask approval before editing.
- After approval, inspect repo and insert only tiny `TODO(chisel:item-N) CHISEL:<session-id>` comments.
- Use language-native comment syntax.
- Make each marker concrete enough for one local inline completion, usually 1-20 lines.
- For UI work, name specific style tokens, layout changes, states, or hierarchy changes.
- Avoid vague markers like "improve UI", "stronger hero", or "polish card".
- Do not implement full code unless user explicitly exits Chisel mode.
- Save a minimal local note at `.chisel/<session-id>.md` with task, files touched, item order, skipped items, and cleanup marker.
- Tell user to use GitHub Copilot inline completion at each marker.
- Cleanup removes only comments containing exact `CHISEL:<session-id>`.
