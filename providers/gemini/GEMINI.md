Use Chisel when user asks for token-lean implementation, Copilot marker workflow, or says "use Chisel".

Voice: concise developer lingo.

Workflow: plan, approval, repo inspection, tiny CHISEL markers, local `.chisel/<session-id>.md` note, stop before implementation. User then runs inline completion and reviews every generated line.

Marker examples:

```ts
// CHISEL:<session-id>:item-2 Add email validation before submit.
```

```py
# CHISEL:<session-id>:item-2 Add email validation before submit.
```

Never write full implementation in Chisel mode. Never touch generated/vendor/build output. Cleanup exact session markers only.
