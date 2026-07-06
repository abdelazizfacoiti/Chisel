Use Chisel when user asks for token-lean implementation, Copilot markers, or says "use Chisel".

Style: short developer lingo. No ceremony.

CLI: use `chisel <command>` when available. If `command -v chisel` fails, use `npx -y github:abdelazizfacoiti/Chisel -- <command>` instead. Do not call a missing PATH command a skill version or revision problem.

Plan first. Chisel has two phases: plan-only, then marker-pass-only. Ask: "Approve marker pass?" Do not edit files before explicit approval. Approval for the marker pass means comment insertion only, not implementation. Tiny mode max: 3 markers. Normal mode max: 8 markers. If more items remain, report `skipped: marker cap reached`. After approval, inspect files and place markers only with `chisel insert --slug <slug> --item <item-id> --file <path> --anchor "<exact existing line to anchor on>" --position before --instruction "<text>"`, using the `npx` fallback if needed, one shell call per marker. Choose an anchor string that appears exactly once in the file, preferring a full existing line. If `chisel insert` fails, report that item as skipped with the CLI reason and do not edit the file directly. Each marker should guide one local completion, usually 1-20 lines, and name the concrete code move. Every CHISEL marker must be on its own line. Never append a marker after code on the same line. The tracking line and instruction line must be adjacent. For UI work, include spacing, hierarchy, color role, component state, or interaction behavior. Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object. Avoid vague markers like "improve UI" or "polish card". Check for the same item or same `CHISEL:<slug>` marker before calling `chisel insert`. Do not duplicate markers. Save minimal `.chisel/<slug>.md` and `.chisel/<slug>.json` receipts with task, files touched, item order, skipped items, cleanup marker, and "markers only" status. Run `chisel verify <slug>` or the local equivalent and include the output before calling the pass clean. Stop before full implementation in the same turn. User completes with inline completion or by hand and reviews every line. Stage mode is opt-in only. Only stage old code when the user explicitly asks to. Never keep a staged version unless syntax check passes. Never wrap already-commented code in another block comment.
If `chisel verify <slug>` reports FAIL, say so explicitly and do not claim the pass was clean.

Comment syntax quick reference:
| Surface | Syntax |
|---|---|
| JS / TS / TSX / Go / Rust / Java | `// CHISEL:<slug> item-N`<br>`// TODO: ...` |
| Python / YAML | `# CHISEL:<slug> item-N`<br>`# TODO: ...` |
| HTML / Vue template / Svelte markup | `<!-- CHISEL:<slug> item-N -->`<br>`<!-- TODO: ... -->` |
| CSS / SCSS | `/* CHISEL:<slug> item-N */`<br>`/* TODO: ... */` |
| SQL | `-- CHISEL:<slug> item-N`<br>`-- TODO: ...` |
| Vue / Svelte `<script>` | `// CHISEL:<slug> item-N`<br>`// TODO: ...` |

Skip generated/vendor/build output, binary files, and lock files unless explicitly approved. Do not offer full implementation as the default next step after markers are placed. Cleanup exact session markers only.
