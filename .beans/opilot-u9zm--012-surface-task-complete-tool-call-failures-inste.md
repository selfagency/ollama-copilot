---
# opilot-u9zm
title: 012 Surface task_complete tool-call failures instead of ignoring them
status: completed
type: bug
priority: low
created_at: 2026-04-14T21:38:28Z
updated_at: 2026-04-15T01:25:00Z
parent: opilot-nqwd
---

Source issue 012 from `docs/plans/remediation-plan.md`.

## Summary

Errors from the `task_complete` tool call are silently ignored, which can hide workflow failures and make agentic runs harder to understand.

## Files

- `src/extension.ts`

## Remediation Goal

Handle `task_complete` failures explicitly so the run can report what happened and recover or stop intentionally.

## Todo

- [x] Locate the existing `task_complete` error-swallowing path
- [x] Decide whether failures should warn, fail the request, or annotate the chat output
- [x] Implement explicit handling with appropriate diagnostics
- [x] Add tests covering successful and failed completion-tool flows
- [x] Verify agentic chat runs no longer lose these failures silently

## Summary of Changes

- Replaced silent `task_complete` error swallowing in `src/extension.ts` with explicit warning diagnostics in both:
  - native Ollama tool-call path
  - VS Code LM API tool-call path
- Added tests in `src/extension.test.ts` to verify warnings are emitted when `task_complete` invocation fails in each path.

Validation run:

- `pnpm vitest run src/extension.test.ts`
- `pnpm run compile`
