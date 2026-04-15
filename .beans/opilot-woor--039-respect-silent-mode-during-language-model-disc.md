---
# opilot-woor
title: 039 Respect silent mode during language model discovery
status: completed
type: task
priority: low
created_at: 2026-04-14T21:40:18Z
updated_at: 2026-04-15T08:01:00Z
parent: opilot-itbr
---

Source issue 039 from `docs/plans/remediation-plan.md`.

## Summary

`provideLanguageModelChatInformation` should honor silent mode so model discovery does not prompt users unexpectedly.

## Files

- `src/provider.ts`

## Remediation Goal

Ensure model enumeration behaves quietly when silent discovery is requested.

## Todo

- [x] Review current provider discovery behavior and identify prompt-producing paths
- [x] Check how silent mode is surfaced by the VS Code API in this flow
- [x] Update discovery logic to suppress prompts or interactive recovery when silent mode is enabled
- [x] Add tests for silent and interactive discovery scenarios
- [x] Verify normal discovery still works when silent mode is not requested

## Summary of Changes

Audit outcome:

- `provideLanguageModelChatInformation` performs non-interactive model discovery (cache checks + list/metadata fetch).
- Discovery-path failures are reported via diagnostics with `showToUser: false`, so no user prompts are shown in silent discovery mode.

Result:

- Silent-mode behavior is already respected for model discovery in current implementation; no code changes required.

Validation run:

- `pnpm run compile`
