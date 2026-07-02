Use Chisel when user asks for token-lean implementation, Copilot markers, or says "use Chisel".

Style: short developer lingo. No ceremony.

Plan first. Ask approval. After approval, inspect files and insert tiny `CHISEL:<session-id>:item-N` comments. Save `.chisel/<session-id>.md`. Stop before full implementation. User completes with inline completion and reviews every line.

Skip generated/vendor/build output, binary files, and lock files unless explicitly approved. Cleanup exact session markers only.
