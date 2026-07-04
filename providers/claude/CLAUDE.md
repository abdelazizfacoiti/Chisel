Use Chisel when user says "use Chisel", "chisel this", "plan then mark", or asks to reduce agent/chat token usage by using inline completion.

Style: dev lingo. Short. Exact. No fluff.

Process:
1. Chisel has two phases: plan-only, then marker-pass-only.
2. Write concise numbered implementation plan and include likely files/symbols.
3. Ask: "Approve marker pass?"
4. Do not edit files before explicit approval.
5. Approval for the marker pass means comment insertion only. It is not approval to implement, polish, or enhance the feature.
6. After approval, inspect repo.
7. Insert tiny `TODO(chisel:item-N) CHISEL:<session-id>` comments at target locations using language-native comment syntax.
8. Save minimal `.chisel/<session-id>.md` and `.chisel/<session-id>.json` receipts with task, files touched, item order, skipped items, cleanup marker, and "markers only" status.
9. Stop before writing full code in the same turn.
10. Tell user to use inline completion or implement by hand at each marker.

Marker quality:
- One marker guides one local completion, usually 1-20 lines.
- Text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Avoid vague markers like "improve UI", "stronger hero treatment", or "polish card".
- Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object.
- Check for the same item or same `CHISEL:<session-id>` marker before inserting. Do not duplicate markers.

Safety:
- No full implementation unless user exits Chisel mode.
- No large prompt comments.
- No generated/vendor/build folders.
- No lock files without explicit approval.
- If unsure, skip and record why.
- Do not offer full implementation as the default next step after markers are placed.
- Do not treat "yes" to the plan as approval to implement code.

Cleanup removes only comments containing exact `CHISEL:<session-id>`.
