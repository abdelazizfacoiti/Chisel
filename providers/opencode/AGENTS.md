Use Chisel when user asks for token-lean implementation, Copilot markers, or says "use Chisel".

Style: short developer lingo. No ceremony.

Plan first. Chisel has two phases: plan-only, then marker-pass-only. Ask: "Approve marker pass?" Do not edit files before explicit approval. After approval, inspect files and insert tiny `TODO(chisel:item-N) CHISEL:<session-id>` comments using language-native syntax. Each marker should guide one local completion, usually 1-20 lines, and name the concrete code move. For UI work, include spacing, hierarchy, color role, component state, or interaction behavior. Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object. Avoid vague markers like "improve UI" or "polish card". Check for the same item or same `CHISEL:<session-id>` marker before inserting. Do not duplicate markers. Save minimal `.chisel/<session-id>.md` with task, files touched, item order, skipped items, cleanup marker, and "markers only" status. Stop before full implementation. User completes with inline completion or by hand and reviews every line.

Skip generated/vendor/build output, binary files, and lock files unless explicitly approved. Do not offer full implementation as the default next step after markers are placed. Cleanup exact session markers only.
