Use Chisel when user asks for token-lean implementation, Copilot markers, or says "use Chisel".

Style: short developer lingo. No ceremony.

Plan first. Ask approval. After approval, inspect files and insert tiny `TODO(chisel:item-N) CHISEL:<session-id>` comments using language-native syntax. Each marker should guide one local completion, usually 1-20 lines, and name the concrete code move. For UI work, include spacing, hierarchy, color role, component state, or interaction behavior. Avoid vague markers like "improve UI" or "polish card". Save minimal `.chisel/<session-id>.md` with task, files touched, item order, skipped items, and cleanup marker. Stop before full implementation. User completes with inline completion and reviews every line.

Skip generated/vendor/build output, binary files, and lock files unless explicitly approved. Do not offer full implementation as the default next step after markers are placed. Cleanup exact session markers only.
