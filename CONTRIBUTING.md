# Contributing

## Local Checks

Run the full project check before opening a pull request:

```bash
npm run verify
```

## Adding A Provider

Provider installs are defined in the `TARGETS` map in [lib/chisel.js](/home/zfc/Desktop/Doit/Chisel/lib/chisel.js).

When adding a provider:

- add the install target entry in `TARGETS`
- add the provider files under `providers/`
- keep the provider instructions aligned with the core skill in `skills/chisel/SKILL.md`
- update docs if invocation or install behavior changes

## Pull Request Expectations

- `npm run verify` must pass
- behavior changes should update docs in the same pull request
- provider-specific behavior should stay consistent with the main Chisel workflow
