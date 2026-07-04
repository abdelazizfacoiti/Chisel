Use Chisel when user asks for token-lean implementation, Copilot markers, or says "use Chisel".

Style: short developer lingo. No ceremony.

Plan first. Chisel has two phases: plan-only, then marker-pass-only. Ask: "Approve marker pass?" Do not edit files before explicit approval. Approval for the marker pass means comment insertion only, not implementation. Tiny mode max: 3 markers. Normal mode max: 8 markers. If more items remain, report `skipped: marker cap reached`. After approval, inspect files and insert tiny `TODO(chisel:item-N) CHISEL:<session-id>` comments using language-native syntax. Each marker should guide one local completion, usually 1-20 lines, and name the concrete code move. Every CHISEL marker must be on its own line. Never append a marker after code on the same line. For UI work, include spacing, hierarchy, color role, component state, or interaction behavior. Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object. Avoid vague markers like "improve UI" or "polish card". Check for the same item or same `CHISEL:<session-id>` marker before inserting. Do not duplicate markers. Save minimal `.chisel/<session-id>.md` and `.chisel/<session-id>.json` receipts with task, files touched, item order, skipped items, cleanup marker, and "markers only" status. Stop before full implementation in the same turn. User completes with inline completion or by hand and reviews every line.

Comment syntax quick reference:
| Surface | Syntax |
|---|---|
| JS / TS / TSX / Go / Rust / Java | `// TODO(chisel:item-N) CHISEL:<session-id> ...` |
| Python / YAML | `# TODO(chisel:item-N) CHISEL:<session-id> ...` |
| HTML / Vue template / Svelte markup | `<!-- TODO(chisel:item-N) CHISEL:<session-id> ... -->` |
| CSS / SCSS | `/* TODO(chisel:item-N) CHISEL:<session-id> ... */` |
| SQL | `-- TODO(chisel:item-N) CHISEL:<session-id> ...` |
| Vue / Svelte `<script>` | `// TODO(chisel:item-N) CHISEL:<session-id> ...` |

Skip generated/vendor/build output, binary files, and lock files unless explicitly approved. Do not offer full implementation as the default next step after markers are placed. Cleanup exact session markers only.
