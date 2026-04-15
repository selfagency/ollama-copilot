---
# opilot-o64p
title: 001 Extract duplicated chat utilities into a shared module
status: completed
type: task
priority: high
created_at: 2026-04-14T21:38:28Z
updated_at: 2026-04-14T23:00:54Z
parent: opilot-1ubu
id: opilot-o64p
---

Source issue 001 from `docs/plans/remediation-plan.md`.

## Summary

Six chat utility functions are duplicated across `src/extension.ts` and `src/provider.ts`, creating a high-risk maintenance hotspot.

## Files

- `src/extension.ts`
- `src/provider.ts`
- new shared module such as `src/chatUtils.ts`

## Remediation Goal

Consolidate the duplicated helpers into a single tested module so both call sites share behavior and future fixes land once.

## Todo

- [x] Identify the exact duplicated functions and current call signatures
- [x] Design the shared module API with minimal churn for both consumers
- [x] Move the shared logic into a common module and update imports
- [x] Add or update unit tests covering fallback, streaming, and tool-call mapping behavior
- [x] Verify behavior remains unchanged for both the chat participant and LM provider

## Summary of Changes

Extracted duplicated chat transport helpers into `src/chatUtils.ts` and rewired both `src/extension.ts` and `src/provider.ts` to use the shared implementation.

Shared helpers now cover:

- OpenAI tool-call mapping conversion
- SDK options building from model overrides
- OpenAI-compatible stream/non-stream chat paths with native SDK fallback
- Native SDK stream/non-stream wrappers

Validation run:

- `pnpm run compile`
- `pnpm vitest run src/provider.test.ts src/extension.test.ts`
