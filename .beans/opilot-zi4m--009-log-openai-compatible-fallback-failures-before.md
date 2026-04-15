---
# opilot-zi4m
title: 009 Log OpenAI-compatible fallback failures before native fallback
status: completed
type: bug
priority: normal
created_at: 2026-04-14T21:38:28Z
updated_at: 2026-04-15T00:24:00Z
parent: opilot-nqwd
id: opilot-zi4m
---

Source issue 009 from `docs/plans/remediation-plan.md`.

## Summary

OpenAI-compatible transport failures currently fall back silently, which makes configuration and compatibility problems difficult to diagnose.

## Files

- `src/extension.ts`

## Remediation Goal

Log the fallback reason clearly enough for developers and users to understand what failed without degrading the recovery path.

## Todo

- [x] Identify the silent fallback catch blocks in the OpenAI-compatible chat paths
- [x] Add warning-level diagnostics that explain why fallback was triggered
- [x] Ensure logged details are safe and do not leak secrets or excessive payload data
- [x] Add or update tests that exercise fallback logging behavior
- [x] Verify fallback still works while surfacing actionable diagnostics

## Summary of Changes

Added explicit diagnostics for OpenAI-compatible transport fallback paths in `src/extension.ts`:

- Log warning when OpenAI-compatible stream/chat attempt fails before native fallback.
- Keep fallback path unchanged so recovery still succeeds.
- Ensure fallback logs do not include secrets (host display redaction is applied elsewhere).

Added test coverage in `src/extension.test.ts` to ensure fallback behavior remains functional while diagnostics are surfaced.

Validation run:

- `pnpm vitest run src/client.test.ts src/extension.test.ts src/extension.utils.test.ts`
- `pnpm run compile`
