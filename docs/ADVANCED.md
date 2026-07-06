# Advanced Chisel Notes

Advanced and opt-in behavior lives here so the main README can stay focused on the core loop.

## Stage Mode

Stage mode is opt-in. Use it only when you explicitly want Chisel to mark existing code as replaceable by commenting it out safely.

- Default Chisel behavior is still markers only. Working code stays untouched unless you ask to stage it.
- For JS/TS/Go/Rust/Java/Python/YAML and similar line-comment surfaces, Chisel stages by turning the old lines into commented lines between `CHISEL-STAGE ... begin/end`.
- For block-comment-only surfaces like HTML or CSS, Chisel stages only if the selected code does not already contain the same nested comment token.
- Chisel refuses stage mode if it cannot get a clean syntax check on the staged file.
- `chisel cleanup <slug>` restores staged code by default. Use `--discard-staged` only when you want the old staged block deleted.

## Marker Format Compatibility

Chisel's canonical marker format is the two-line tracking plus TODO form documented in the main README.

Old single-line markers still work with `chisel status` and `chisel cleanup`. New sessions should use the two-line format going forward.

## Migrating From v0.2

Chisel v0.3 changes how new passes are written and audited. Existing v0.2 sessions are still supported: sessions without stored diff hunks fall back to the old marker scan and exact line-matching cleanup path, so in-flight work is not stranded after upgrade.

New v0.3 passes use `chisel insert` instead of freehand source edits. Each successful insert records a lightweight manifest item with the slug, anchor, item id, and diff hunk. In git repos, Chisel stages marker hunks automatically and `chisel verify` audits the staged diff. On Claude Code, the installed hook blocks direct edits to active-pass files until `chisel pass end <slug>` or cleanup marks the pass inactive.

## Provider Notes

### Codex

- The reliable invocation paths are `$chisel`, `/skills`, or plain language like `use Chisel for this task: ...`.
- Chisel also installs a repo-local `.codex/prompts/chisel.md`.
- `--with-codex-prompt` adds the deprecated user-local prompt at `~/.codex/prompts/chisel.md` for `/prompts:chisel`.
- Chisel includes `.codex-plugin/plugin.json` with `skills: "./skills/"` so the same skill can be packaged as a Codex plugin.

### GitHub Copilot

- The reliable path is plain language such as `Use Chisel for this task: ...`.
- If your Copilot surface exposes prompt files, you can also select `chisel.prompt.md` from the prompt or command picker.
