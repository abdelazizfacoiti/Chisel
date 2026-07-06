# Chisel

Use Chisel when the user asks to reduce chat-agent token usage, says "use Chisel", or asks for Copilot-marker implementation.

Style: dev lingo. Short. Exact. No fluff.

Workflow:

1. Chisel has two phases: plan-only, then marker-pass-only.
2. Make a concise numbered implementation plan and include likely files/symbols for each item.
3. Group plan items by method using a shared-decision vs separable-concerns test so intended marker count is visible before approval.
4. If one method should get one cohesive marker, say that directly in the plan.
5. Ask: "Approve marker pass?"
6. Do not edit files before explicit approval.
7. Approval for the marker pass means comment insertion only. It is not approval to implement, polish, or enhance the feature.
8. Tiny mode max: 3 markers. Normal mode max: 8 markers. If more items remain, report `skipped: marker cap reached`.
9. After approval, inspect the repo.
10. For each marker, call `chisel insert --slug <slug> --item <item-id> --file <path> --anchor "<exact existing line to anchor on>" --position before --instruction "<text>"`.
11. Choose an anchor string that appears exactly once in the file. Prefer a full existing line over a short fragment.
12. If `chisel insert` fails, report that item as skipped with the CLI reason. Do not edit the file directly.
13. Save `.chisel/<slug>.md` and `.chisel/<slug>.json` with task, files touched, item order with file/line, skipped items, cleanup marker, and "markers only" status.
14. Run `chisel verify <slug>` or the local equivalent and include the output before declaring the marker pass complete.
15. Stop before writing full code in the same turn.
16. Tell user to trigger inline completion or implement by hand at each marker and review the generated code.
17. Only use stage mode if the user explicitly asks to stage old code, and only keep the staged version if syntax check passes.

Marker format:

```ts
// CHISEL:<slug> item-2
// TODO: Add email validation before submit.
```

Good UI marker:

```tsx
// CHISEL:<slug> item-4
// TODO: Replace flat card surface with subtle border, shadow, and pressed state styles.
```

Bad marker:

```tsx
// CHISEL:<slug> item-4
// TODO: Improve card polish.
```

Rules:

- Never write the full implementation in Chisel mode.
- Never treat "yes" to the plan as approval to implement code.
- Never insert huge prompt comments.
- One marker should guide one local completion, usually 1-20 lines.
- Use language-native comment syntax.
- Do not write marker comments directly. The CLI is the only source-file writer during a marker pass.
- Every CHISEL marker must be on its own line. Never append a marker after code on the same line.
- Tracking line and instruction line must be adjacent, with the instruction line immediately following the tracking line.
- The instruction line must read as a complete TODO without needing the tracking line.
- Marker text must name the concrete code move: variable, prop, style token, branch, validation rule, component state, or test case.
- For UI work, include concrete visual intent: spacing value, component state, hierarchy, color role, typography role, or interaction behavior.
- Place markers inside the exact function/component/class when possible; otherwise directly above the relevant branch, call, render block, or style object.
- Check for the same item or same `CHISEL:<slug>` marker before calling `chisel insert`. Do not duplicate markers.
- Use one top-of-method marker for one shared design or behavior decision. Use multiple markers inside a method only when the concerns are genuinely separate.
- Never overwrite code.
- Never touch generated/vendor/build folders.
- Avoid `.git`, `node_modules`, `dist`, `build`, `target`, `coverage`, `.next`, `out`, binary files, and lock files.
- If a location is uncertain, skip that item and record why.
- Do not offer full implementation as the default next step after markers are placed.
- Never say you are "applying enhancements" or "making improvements" while still in Chisel mode.
- If `chisel verify <slug>` reports FAIL, say so explicitly and do not claim the pass was clean.
- Cleanup removes only comments containing exact `CHISEL:<slug>`.
- Never wrap already-commented code in another block comment.

Session note stays minimal. Do not duplicate the full marker instructions there.

Comment syntax quick reference:
| Surface | Syntax |
|---|---|
| JS / TS / TSX / Go / Rust / Java | `// CHISEL:<slug> item-N`<br>`// TODO: ...` |
| Python / YAML | `# CHISEL:<slug> item-N`<br>`# TODO: ...` |
| HTML / Vue template / Svelte markup | `<!-- CHISEL:<slug> item-N -->`<br>`<!-- TODO: ... -->` |
| CSS / SCSS | `/* CHISEL:<slug> item-N */`<br>`/* TODO: ... */` |
| SQL | `-- CHISEL:<slug> item-N`<br>`-- TODO: ...` |
| Vue / Svelte `<script>` | `// CHISEL:<slug> item-N`<br>`// TODO: ...` |

Limits:

Chisel does not know exact Copilot billing or usage. It reduces chat-agent work by shifting implementation drafting to inline completion. User must review generated code and run tests.
