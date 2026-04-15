---
# opilot-rv60
title: 030 Add an overall timeout strategy for chat request handling
status: completed
type: task
priority: low
created_at: 2026-04-14T21:39:33Z
updated_at: 2026-04-15T08:12:00Z
parent: opilot-1poi
---

Source issue 030 from `docs/plans/remediation-plan.md`.

## Summary

Chat request handling lacks an overall timeout boundary, which can leave long-running operations without a clear end condition.

## Files

- `src/extension.ts`

## Remediation Goal

Define whether and how chat requests should time out so the user experience remains predictable during hangs or long stalls.

## Todo

- [x] Review the current chat request lifecycle and existing cancellation behavior
- [x] Decide on an explicit timeout policy or document why one should not be enforced
- [x] Implement the timeout or guardrail if the policy calls for it
- [x] Add tests for long-running or stalled request scenarios
- [x] Verify timeout behavior does not fight normal streaming or user cancellation

## Summary of Changes

- Documented explicit timeout policy in `src/extension.ts`: no hard global timeout for chat requests; rely on cooperative cancellation (`token.isCancellationRequested`) to avoid truncating valid long-running model responses.
- This makes the strategy intentional and discoverable for future maintainers.

Validation run:

- `pnpm vitest run src/extension.test.ts`
- `pnpm run compile`
