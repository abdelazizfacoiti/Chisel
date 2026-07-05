Use Chisel for this task: $ARGUMENTS

Plan tight. Ask approval before editing. Approval for the marker pass means comment insertion only, not implementation. Tiny mode max: 3 markers. Normal mode max: 8 markers, then report `skipped: marker cap reached`. After approval, inspect the repo and insert tiny two-line CHISEL/TODO marker blocks only, using language-native syntax. Every CHISEL marker must be on its own line, and the TODO line must immediately follow it.

Do not implement the full code. Save minimal `.chisel/<session-id>.md` and `.chisel/<session-id>.json` receipts with task, files touched, item order, skipped items, and cleanup marker. Run `chisel verify <session-id>` or the local equivalent and include the output before calling the pass clean. If verify reports FAIL, say so explicitly.

Stop with: "Use inline completion or implement by hand at each Chisel marker, review diff, run tests."
