# Changelog

## v0.3.0

- added deterministic anchor-based marker insertion with `chisel insert`
- moved new passes to git-native tracking, verification, and cleanup through lightweight diff-hunk manifests
- added human-readable pass slugs with no-argument latest-pass defaults for status, verify, and cleanup
- added a Claude Code PreToolUse enforcement hook that blocks direct edits to active-pass files
- added `chisel scan` for cheap pre-search before planning

## v0.2.0

- added deterministic `chisel status`, `chisel verify`, `chisel cleanup`, and `chisel doctor` commands
- switched the canonical marker format to the two-line `CHISEL` plus `TODO` form
- added opt-in stage mode for safely staging replaceable code blocks
- added marker granularity guidance so plans show intended marker count before approval
