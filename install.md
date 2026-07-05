# Install Chisel

Chisel v0.2 is an instruction and command pack with a lightweight local trust layer. The `chisel` command installs provider files, scans sessions, previews cleanup, and checks install health.

Chisel session notes are local by default. Consider adding `.chisel/` to `.gitignore` unless your team wants to review Chisel receipts.

## One-Liner

Run from the repo where you want Chisel active:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only codex
```

Install another provider:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only copilot
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only claude
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only cursor
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --all
```

Legacy shorthand still works for backward compatibility:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- --only codex
```

Local testing from a Chisel clone:

```bash
node bin/chisel-install.js --only codex --target /path/to/project --dry-run
```

## Pinning A Version

Use a tag-pinned GitHub install like `github:abdelazizfacoiti/Chisel#v0.2.0` for reproducible installs and to avoid silent behavior changes when the default branch moves.

## Flags

- `--only <provider>` installs one provider.
- `--all` installs every provider file.
- `--target <path>` chooses the project directory. Default: current directory.
- `--dry-run` prints writes without touching files.
- `--force` overwrites existing provider files.
- `--with-codex-prompt` also installs deprecated Codex custom prompt support at `~/.codex/prompts/chisel.md`.
- `--list-providers` prints supported provider ids.
- `--print <provider>` prints the files that would be installed for one provider.
- `--doctor` checks source files and the target repo for common install issues.
- `--provider <provider|all>` narrows `doctor` checks.
- `status [session-id]` scans `.chisel/` receipts and current repo markers.
- `verify [session-id]` audits whether a session stayed markers-only by checking markers, git diff, and best-effort syntax for touched files.
- `cleanup [session-id]` previews removal of exact session marker lines.
- `cleanup [session-id] --apply` removes both lines of a standalone marker block containing `CHISEL:<session-id>`.
- `cleanup [session-id] --apply --discard-staged` deletes staged old-code blocks instead of restoring them.

Provider ids: `copilot`, `codex`, `claude`, `gemini`, `cursor`, `opencode`.

## Existing Files

By default, Chisel does not overwrite existing provider files.

If a target file already exists, the installer skips it unless you pass `--force`.

Use `--dry-run` before `--force` if you want to inspect what would change.

If Chisel is already installed, re-run with `--force` after upgrading if you want to refresh the installed provider files from the latest version.

## Inspect Before Installing

List supported providers:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- --list-providers
```

Print the files for one provider:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- --print codex
```

Check a repo after installing:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- doctor --provider all
```

Inspect a Chisel session:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- status
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- status 20260704153000-a1b2c3
```

Audit a marker pass:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- verify
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- verify 20260704153000-a1b2c3
```

Preview and apply cleanup:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- cleanup
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- cleanup --apply
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- cleanup 20260704153000-a1b2c3
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- cleanup 20260704153000-a1b2c3 --apply
```

Cleanup is literal: dry-run previews matching lines, and `--apply` removes both lines of a standalone marker block containing the exact `CHISEL:<session-id>` string. Inline code+marker lines are warned and skipped for manual cleanup. If a session used opt-in stage mode, cleanup restores staged code by default. Add `--discard-staged` only when you want to delete the staged old-code block instead. `npx ... -- verify <session-id>` is the session audit command; `npm run verify` is only for Chisel repo development.

## What Gets Installed

| Provider | Files |
|---|---|
| `codex` | `AGENTS.md`, `.codex/config.toml`, `.codex/prompts/chisel.md`, `.codex-plugin/plugin.json`, `.agents/skills/chisel/SKILL.md` |
| `copilot` | `.github/copilot-instructions.md`, `.github/prompts/chisel.prompt.md` |
| `claude` | `CLAUDE.md`, `.claude/commands/chisel.md` |
| `gemini` | `GEMINI.md` |
| `cursor` | `.cursor/rules/chisel.mdc` |
| `opencode` | `.opencode/AGENTS.md` |

The repo also includes `.codex-plugin/plugin.json` so Codex installs have matching plugin metadata in the target repo.

## Codex

Codex reusable workflows are skills. Chisel installs a repo skill here:

```text
.agents/skills/chisel/SKILL.md
.codex/prompts/chisel.md
.codex-plugin/plugin.json
```

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only codex
```

Use:

```text
use Chisel for this task: improve the checkout form validation
```

Optional shortcuts:

```text
/chisel improve the checkout form validation
$chisel improve the checkout form validation
/skills
```

If your Codex build surfaces repo prompt files, you can also use:

```text
/chisel improve the checkout form validation
```

Optional deprecated prompt command:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only codex --with-codex-prompt
```

Restart Codex, then invoke:

```text
/prompts:chisel improve the checkout form validation
```

Important: the reliable Codex invocation paths are `$chisel`, `/skills`, or plain language like `use Chisel for this task: ...`. The user-local prompt installed by `--with-codex-prompt` is available via `/prompts:chisel`.

## GitHub Copilot

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only copilot
```

Files:

```text
.github/copilot-instructions.md
.github/prompts/chisel.prompt.md
```

Use:

```text
Use Chisel for this task: improve the checkout form validation
```

Optional shortcut: if your Copilot surface exposes prompt files, select `chisel.prompt.md` from the prompt or command picker.

## Claude Code

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only claude
```

Files:

```text
CLAUDE.md
.claude/commands/chisel.md
```

Use:

```text
Use Chisel for this task: improve the checkout form validation
```

Optional shortcut:

```text
/chisel improve the checkout form validation
```

## Gemini

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only gemini
```

Then say:

```text
Use Chisel for this task: improve the checkout form validation
```

## Cursor

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only cursor
```

Then say:

```text
Use Chisel for this task: improve the checkout form validation
```

## opencode

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel#v0.2.0 -- install --only opencode
```

Then say:

```text
Use Chisel for this task: improve the checkout form validation
```

## Manual Copy

If you do not want `npx`, copy the files listed in "What Gets Installed" from `providers/` and `skills/` into your target repo.

## Uninstall

Chisel v0.2 installs plain text instruction files. To uninstall, remove the provider files that were added for your tool.

For example, for Codex:

```bash
rm -rf .agents/skills/chisel
rm -f .codex/config.toml
rm -f .codex/prompts/chisel.md
rm -f .codex-plugin/plugin.json
rm -f AGENTS.md
```

Only remove shared files like `AGENTS.md`, `CLAUDE.md`, or `.github/copilot-instructions.md` if they were created only for Chisel.
