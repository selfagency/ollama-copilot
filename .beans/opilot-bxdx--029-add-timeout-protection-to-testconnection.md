---
# opilot-bxdx
title: 029 Add timeout protection to testConnection
status: completed
type: bug
priority: normal
created_at: 2026-04-14T21:39:33Z
updated_at: 2026-04-15T01:16:00Z
parent: opilot-1poi
---

Source issue 029 from `docs/plans/remediation-plan.md`.

## Summary

`testConnection()` has no timeout protection, which can leave connection checks hanging longer than users expect.

## Files

- `src/client.ts`

## Remediation Goal

Use bounded timeout behavior so connection testing fails predictably and callers can surface clearer guidance.

## Todo

- [x] Review how `testConnection()` currently performs network requests
- [x] Add timeout support using the appropriate cancellation mechanism
- [x] Ensure timeout behavior is distinguishable from other failure types
- [x] Add tests for success, timeout, and cancellation behavior
- [x] Verify callers receive a predictable and useful failure outcome

## Summary of Changes

- Updated `testConnection(client)` in `src/client.ts` to use timeout-bounded behavior via `Promise.race`, with optional `timeoutMs` (default 5000ms).
- Ensured timeout timer cleanup in `finally`.
- Added tests in `src/client.test.ts` for:
  - success path
  - thrown error path
  - timeout path
  - cancellation (`AbortError`) path

Validation run:

- `pnpm vitest run src/client.test.ts`
- `pnpm run compile`
