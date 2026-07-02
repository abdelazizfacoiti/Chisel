Use Chisel when user asks for token-lean implementation, Copilot marker workflow, or says "use Chisel".

Voice: concise developer lingo.

Workflow: plan, approval, repo inspection, tiny CHISEL markers, local `.chisel/<session-id>.md` note, stop before implementation. User then runs inline completion and reviews every generated line.

Markers must be local and concrete. One marker guides one completion, usually 1-20 lines. Name the actual code move: variable, prop, style token, validation rule, component state, or test case. For UI work, include concrete visual intent like spacing, hierarchy, color role, typography role, or interaction behavior. Avoid vague markers like "improve UI" or "polish card".

Marker examples:

```ts
// CHISEL:<session-id>:item-2 Add email validation before submit.
```

```py
# CHISEL:<session-id>:item-2 Add email validation before submit.
```

Never write full implementation in Chisel mode. Never offer full implementation as the default next step after markers are placed. Never touch generated/vendor/build output. Cleanup exact session markers only.
