Use Chisel when user asks for token-lean implementation, Copilot marker workflow, or says "use Chisel".

Voice: concise developer lingo.

CLI: use `chisel <command>` when available. If `command -v chisel` fails, use `npx -y github:abdelazizfacoiti/Chisel -- <command>` instead. Do not call a missing PATH command a skill version or revision problem.

Workflow: plan-only, then marker-pass-only. No file edits before explicit approval. Approval for the marker pass means comment insertion only, not implementation. Tiny mode max: 3 markers. Normal mode max: 8 markers. If more items remain, report `skipped: marker cap reached`. Build the plan by grouping items by method using a shared-decision vs separable-concerns test so intended marker count is visible before approval. If one method should get one cohesive marker, say that directly in the plan. After approval, inspect repo and place markers only with `chisel insert --slug <slug> --item <item-id> --file <path> --anchor "<exact existing line to anchor on>" --position before --instruction "<text>"`, using the `npx` fallback if needed, one shell call per marker. Choose an anchor string that appears exactly once in the file, preferring a full existing line. If `chisel insert` fails, report that item as skipped with the CLI reason and do not edit the file directly. Save minimal `.chisel/<slug>.md` and `.chisel/<slug>.json` receipts with "markers only" status, run `chisel verify <slug>` or the local equivalent and include the output, then stop before implementation in the same turn. User then runs inline completion or implements by hand and reviews every generated line.
Stage mode is opt-in only. Only stage old code when the user explicitly asks to. Never keep a staged version unless syntax check passes.

Markers must be local and concrete. One marker guides one completion, usually 1-20 lines. Do not write marker comments directly; the CLI is the only source-file writer during a marker pass. Every CHISEL marker must be on its own line. Never append a marker after code on the same line. Name the actual code move: variable, prop, style token, validation rule, component state, or test case. For UI work, include concrete visual intent like spacing, hierarchy, color role, typography role, or interaction behavior. Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object. Use one top-of-method marker for one shared design or behavior decision. Use multiple markers inside a method only when the concerns are genuinely separate. Avoid vague markers like "improve UI" or "polish card". Check for the same item or same `CHISEL:<slug>` marker before calling `chisel insert`. Do not duplicate markers.

Marker examples:

```ts
// CHISEL:<slug> item-2
// TODO: Add email validation before submit.
```

```py
# CHISEL:<slug> item-2
# TODO: Add email validation before submit.
```

Comment syntax quick reference:
| Surface | Syntax |
|---|---|
| JS / TS / TSX / Go / Rust / Java | `// CHISEL:<slug> item-N`<br>`// TODO: ...` |
| Python / YAML | `# CHISEL:<slug> item-N`<br>`# TODO: ...` |
| HTML / Vue template / Svelte markup | `<!-- CHISEL:<slug> item-N -->`<br>`<!-- TODO: ... -->` |
| CSS / SCSS | `/* CHISEL:<slug> item-N */`<br>`/* TODO: ... */` |
| SQL | `-- CHISEL:<slug> item-N`<br>`-- TODO: ...` |
| Vue / Svelte `<script>` | `// CHISEL:<slug> item-N`<br>`// TODO: ...` |

Never write full implementation in Chisel mode. Never treat "yes" to the plan as approval to implement code. Never offer full implementation as the default next step after markers are placed. Never touch generated/vendor/build output. Cleanup exact session markers only.
If `chisel verify <slug>` reports FAIL, say so explicitly and do not claim the pass was clean.
Never wrap already-commented code in another block comment.
