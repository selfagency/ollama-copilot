---
# opilot-mkqk
title: 021 Remove deprecated ollama namespace settings declarations
status: completed
type: task
priority: low
created_at: 2026-04-14T21:39:09Z
updated_at: 2026-04-15T01:06:00Z
parent: opilot-dfc1
---

Source issue 021 from `docs/plans/remediation-plan.md`.

## Summary

Deprecated `ollama.*` settings are still declared in `package.json`, which keeps obsolete configuration visible after the namespace migration.

## Files

- `package.json`

## Remediation Goal

Retire obsolete settings contributions once migration support no longer depends on them.

## Todo

- [x] Review the remaining deprecated setting contributions in `package.json`
- [x] Confirm they are no longer needed for compatibility or user guidance
- [x] Remove or deprecate them more clearly according to the intended migration policy
- [x] Validate extension settings UI behavior after the change
- [x] Update any related documentation if settings names change or disappear

## Summary of Changes

- Removed deprecated `ollama.*` settings declarations from `package.json` contributes configuration.
- Kept runtime migration compatibility in `src/settings.ts` intact.
- Updated manifest integrity test in `src/contributes.test.ts` to assert legacy settings are no longer declared.

Validation run:

- `pnpm vitest run src/contributes.test.ts src/settings.test.ts`
- `pnpm run compile`
