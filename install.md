# Install Chisel

Chisel v0 is an instruction and command pack, not a standalone app. The `chisel` command only installs provider files into a project.

## One-Liner

Run from the repo where you want Chisel active:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only codex
```

Install another provider:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only copilot
npx -y github:abdelazizfacoiti/Chisel -- --only claude
npx -y github:abdelazizfacoiti/Chisel -- --only cursor
npx -y github:abdelazizfacoiti/Chisel -- --all
```

Local testing from a Chisel clone:

```bash
node bin/chisel-install.js --only codex --target /path/to/project --dry-run
```

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

Provider ids: `copilot`, `codex`, `claude`, `gemini`, `cursor`, `opencode`.

## Existing Files

By default, Chisel does not overwrite existing provider files.

If a target file already exists, the installer skips it unless you pass `--force`.

Use `--dry-run` before `--force` if you want to inspect what would change.

## Inspect Before Installing

List supported providers:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --list-providers
```

Print the files for one provider:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --print codex
```

Check a repo after installing:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --doctor
```

## What Gets Installed

| Provider | Files |
|---|---|
| `codex` | `AGENTS.md`, `.codex/config.toml`, `.agents/skills/chisel/SKILL.md` |
| `copilot` | `.github/copilot-instructions.md`, `.github/prompts/chisel.prompt.md` |
| `claude` | `CLAUDE.md`, `.claude/commands/chisel.md` |
| `gemini` | `GEMINI.md` |
| `cursor` | `.cursor/rules/chisel.mdc` |
| `opencode` | `.opencode/AGENTS.md` |

The repo also includes `.codex-plugin/plugin.json` for packaging Chisel as a Codex plugin.

## Codex

Codex reusable workflows are skills. Chisel installs a repo skill here:

```text
.agents/skills/chisel/SKILL.md
```

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only codex
```

Use one of:

```text
$chisel improve the checkout form validation
/skills
use Chisel for this task: improve the checkout form validation
```

Optional deprecated prompt command:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only codex --with-codex-prompt
```

Restart Codex, then invoke:

```text
/prompts:chisel improve the checkout form validation
```

Important: Chisel does not claim a native repo-local `/chisel` command in Codex. Codex custom prompts are user-local and deprecated.

## GitHub Copilot

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only copilot
```

Files:

```text
.github/copilot-instructions.md
.github/prompts/chisel.prompt.md
```

In VS Code Copilot Chat, the prompt file should be available through the prompt/command picker where prompt files are supported. Exact slash behavior depends on your VS Code and Copilot version.

## Claude Code

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only claude
```

Files:

```text
CLAUDE.md
.claude/commands/chisel.md
```

Use:

```text
/chisel improve the checkout form validation
```

## Gemini

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only gemini
```

Then say:

```text
use Chisel for this task: improve the checkout form validation
```

## Cursor

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only cursor
```

Then say:

```text
use Chisel for this task: improve the checkout form validation
```

## opencode

Install:

```bash
npx -y github:abdelazizfacoiti/Chisel -- --only opencode
```

Then say:

```text
use Chisel for this task: improve the checkout form validation
```

## Manual Copy

If you do not want `npx`, copy the files listed in "What Gets Installed" from `providers/` and `skills/` into your target repo.

## Uninstall

Chisel v0 installs plain text instruction files. To uninstall, remove the provider files that were added for your tool.

For example, for Codex:

```bash
rm -rf .agents/skills/chisel
rm -f .codex/config.toml
rm -f AGENTS.md
```

Only remove shared files like `AGENTS.md`, `CLAUDE.md`, or `.github/copilot-instructions.md` if they were created only for Chisel.
