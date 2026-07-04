Use Chisel when user asks for token-lean implementation, Copilot markers, or says "use Chisel".

Style: short developer lingo. No ceremony.

Plan first. Chisel has two phases: plan-only, then marker-pass-only. Ask: "Approve marker pass?" Do not edit files before explicit approval. Approval for the marker pass means comment insertion only, not implementation. Tiny mode max: 3 markers. Normal mode max: 8 markers. If more items remain, report `skipped: marker cap reached`. After approval, inspect files and insert tiny two-line CHISEL/TODO marker blocks using language-native syntax. Each marker should guide one local completion, usually 1-20 lines, and name the concrete code move. Every CHISEL marker must be on its own line. Never append a marker after code on the same line. The tracking line and instruction line must be adjacent. For UI work, include spacing, hierarchy, color role, component state, or interaction behavior. Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object. Avoid vague markers like "improve UI" or "polish card". Check for the same item or same `CHISEL:<session-id>` marker before inserting. Do not duplicate markers. Save minimal `.chisel/<session-id>.md` and `.chisel/<session-id>.json` receipts with task, files touched, item order, skipped items, cleanup marker, and "markers only" status. Stop before full implementation in the same turn. User completes with inline completion or by hand and reviews every line.

Comment syntax quick reference:
| Surface | Syntax |
|---|---|
| JS / TS / TSX / Go / Rust / Java | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |
| Python / YAML | `# CHISEL:<session-id> item-N`<br>`# TODO: ...` |
| HTML / Vue template / Svelte markup | `<!-- CHISEL:<session-id> item-N -->`<br>`<!-- TODO: ... -->` |
| CSS / SCSS | `/* CHISEL:<session-id> item-N */`<br>`/* TODO: ... */` |
| SQL | `-- CHISEL:<session-id> item-N`<br>`-- TODO: ...` |
| Vue / Svelte `<script>` | `// CHISEL:<session-id> item-N`<br>`// TODO: ...` |

Skip generated/vendor/build output, binary files, and lock files unless explicitly approved. Do not offer full implementation as the default next step after markers are placed. Cleanup exact session markers only.
