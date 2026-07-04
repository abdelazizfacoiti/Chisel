Use Chisel when user asks for token-lean implementation, Copilot marker workflow, or says "use Chisel".

Voice: concise developer lingo.

Workflow: plan-only, then marker-pass-only. No file edits before explicit approval. Approval for the marker pass means comment insertion only, not implementation. Tiny mode max: 3 markers. Normal mode max: 8 markers. If more items remain, report `skipped: marker cap reached`. After approval, inspect repo, insert tiny `TODO(chisel:item-N) CHISEL:<session-id>` markers using language-native comments, save minimal `.chisel/<session-id>.md` and `.chisel/<session-id>.json` receipts with "markers only" status, then stop before implementation in the same turn. User then runs inline completion or implements by hand and reviews every generated line.

Markers must be local and concrete. One marker guides one completion, usually 1-20 lines. Every CHISEL marker must be on its own line. Never append a marker after code on the same line. Name the actual code move: variable, prop, style token, validation rule, component state, or test case. For UI work, include concrete visual intent like spacing, hierarchy, color role, typography role, or interaction behavior. Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object. Avoid vague markers like "improve UI" or "polish card". Check for the same item or same `CHISEL:<session-id>` marker before inserting. Do not duplicate markers.

Marker examples:

```ts
// TODO(chisel:item-2) CHISEL:<session-id> Add email validation before submit.
```

```py
# TODO(chisel:item-2) CHISEL:<session-id> Add email validation before submit.
```

Comment syntax quick reference:
| Surface | Syntax |
|---|---|
| JS / TS / TSX / Go / Rust / Java | `// TODO(chisel:item-N) CHISEL:<session-id> ...` |
| Python / YAML | `# TODO(chisel:item-N) CHISEL:<session-id> ...` |
| HTML / Vue template / Svelte markup | `<!-- TODO(chisel:item-N) CHISEL:<session-id> ... -->` |
| CSS / SCSS | `/* TODO(chisel:item-N) CHISEL:<session-id> ... */` |
| SQL | `-- TODO(chisel:item-N) CHISEL:<session-id> ...` |
| Vue / Svelte `<script>` | `// TODO(chisel:item-N) CHISEL:<session-id> ...` |

Never write full implementation in Chisel mode. Never treat "yes" to the plan as approval to implement code. Never offer full implementation as the default next step after markers are placed. Never touch generated/vendor/build output. Cleanup exact session markers only.
