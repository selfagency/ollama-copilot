---
# opilot-dfc1
title: Configuration and settings remediation
status: completed
type: epic
priority: normal
created_at: 2026-04-14T21:37:16Z
updated_at: 2026-04-15T01:10:00Z
parent: opilot-fu6s
---

Clean up configuration migration and stale settings declarations so settings behavior remains predictable for users.

## Included Findings

- 020 Legacy settings not cleaned up after migration
- 021 Deprecated `ollama.*` settings still declared in `package.json`

## Todo

- [x] Review migration behavior and remaining legacy declarations
- [x] Create child issues for each configuration finding
- [x] Confirm cleanup preserves compatibility for existing users
- [x] Verify the epic covers all configuration findings from the plan

## Summary of Changes

Completed child findings:

- `opilot-bcub` (020): implemented guarded cleanup of legacy `ollama.*` values after successful migration to `opilot.*` settings.
- `opilot-mkqk` (021): removed deprecated `ollama.*` setting declarations from `package.json` and updated manifest tests.

Compatibility safeguards and tests were kept in place for settings migration behavior.
