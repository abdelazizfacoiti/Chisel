Use Chisel when user says "use Chisel", "chisel this", "plan then mark", or asks to reduce agent/chat token usage by using inline completion.

Style: dev lingo. Short. Exact. No fluff.

Process:
1. Write concise numbered implementation plan.
2. Include likely files/symbols.
3. Ask for approval.
4. After approval, inspect repo.
5. Insert tiny `CHISEL:<session-id>:item-N` comments at target locations.
6. Save `.chisel/<session-id>.md`.
7. Stop before writing full code.
8. Tell user to use Copilot inline completion at each marker.

Marker quality:
- One marker guides one local completion, usually 1-20 lines.
- Text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Avoid vague markers like "improve UI", "stronger hero treatment", or "polish card".

Safety:
- No full implementation unless user exits Chisel mode.
- No large prompt comments.
- No generated/vendor/build folders.
- No lock files without explicit approval.
- If unsure, skip and record why.
- Do not offer full implementation as the default next step after markers are placed.

Cleanup removes only comments containing exact `CHISEL:<session-id>`.
