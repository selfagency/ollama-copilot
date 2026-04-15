---
# opilot-1ubu
title: Architecture and duplication remediation
status: completed
type: epic
priority: high
created_at: 2026-04-14T21:37:16Z
updated_at: 2026-04-15T00:32:00Z
parent: opilot-fu6s
---

Address structural duplication and maintainability issues called out in the remediation plan.

## Included Findings

- 001 Six chat utility functions duplicated across `src/extension.ts` and `src/provider.ts`
- 002 `formatBytes()` duplicated across `src/extension.ts`, `src/statusBar.ts`, and `src/sidebar.ts`
- 003 `src/extension.ts` exceeds a maintainable size and mixes too many responsibilities

## Todo

- [x] Review architecture findings and confirm target modules
- [x] Create child issues for each architecture item
- [x] Sequence child issues to minimize merge risk
- [x] Verify the epic covers all architecture findings from the plan

## Summary of Changes

Completed architecture/duplication remediation child tasks:

- `opilot-o64p` (001): extracted shared chat transport helpers into `src/chatUtils.ts` and removed duplicated logic.
- `opilot-cu2n` (002): consolidated byte-formatting via shared `formatBytes` utility.
- `opilot-5lxl` (003): split `extension.ts` helper responsibilities into `src/extensionHelpers.ts`.

All child slices were validated with focused tests and compile checks before commit.
