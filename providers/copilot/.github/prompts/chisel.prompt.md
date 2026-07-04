---
mode: agent
description: "Chisel: plan, place TODO markers, stop before implementation"
---

Use Chisel for this task: ${input:task:Describe the implementation task}

Plan tight. Ask approval before editing. After approval, inspect the repo and insert tiny `TODO(chisel:item-N) CHISEL:<session-id>` comments only, using language-native syntax.

Do not implement the full code. Save minimal `.chisel/<session-id>.md` and `.chisel/<session-id>.json` receipts with task, files touched, item order, skipped items, and cleanup marker.

Stop with: "Use inline completion or implement by hand at each Chisel marker, review diff, run tests."
