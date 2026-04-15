---
# opilot-f7f1
title: 022 Add dedicated tests for removing built-in Ollama models
status: completed
type: task
priority: low
created_at: 2026-04-14T21:39:09Z
updated_at: 2026-04-15T00:58:00Z
parent: opilot-ah8d
---

Source issue 022 from `docs/plans/remediation-plan.md`.

## Summary

`removeBuiltInOllamaFromChatLanguageModels` lacks direct tests even though it mutates configuration files in a sensitive way.

## Files

- `src/extension.ts`
- related test files under `src/*.test.ts`

## Remediation Goal

Add focused coverage that proves the removal logic edits only the intended entries and handles edge cases safely.

## Todo

- [x] Review the current behavior and identify scenarios that deserve direct coverage
- [x] Add focused unit tests for empty, matching, and unrelated configuration content
- [x] Include at least one case that exercises failure or retry behavior if implemented
- [x] Verify the tests are isolated and do not depend on real user configuration
- [x] Confirm the tests would catch accidental over-removal or formatting regressions

## Summary of Changes

Issue already satisfied by dedicated coverage in `src/extension.test.ts` for built-in Ollama conflict removal behavior, including:

- fallback file mutation flow
- concurrent file-change retry behavior
- no-removal-found failure handling

Validation run:

- `pnpm vitest run src/extension.test.ts`
- `pnpm run compile`
