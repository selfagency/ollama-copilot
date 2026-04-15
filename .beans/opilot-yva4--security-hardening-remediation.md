---
# opilot-yva4
title: Security hardening remediation
status: completed
type: epic
priority: high
created_at: 2026-04-14T21:37:16Z
updated_at: 2026-04-15T00:32:00Z
parent: opilot-fu6s
---

Eliminate risky patterns and harden security-sensitive code paths identified in the remediation plan.

## Included Findings

- 004 Shell command construction via string interpolation in `src/sidebar.ts`
- 005 Unsafe direct file write without locking in `src/extension.ts`
- 006 Static `journalctl` command assumes PATH availability
- 007 PowerShell script embedded as a string literal
- 008 Credentials may appear in URL-based error dialogs

## Todo

- [x] Review all affected command execution and file mutation paths
- [x] Create child issues for each security finding
- [x] Identify any shared mitigations that can be handled once
- [x] Verify the epic covers all security findings from the plan

## Summary of Changes

Completed security hardening child tasks:

- `opilot-0g2e` (004): replaced interpolated kill commands with argument-array execution via `execFile`.
- `opilot-5o5n` (005): hardened config-file fallback mutation with bounded compare-and-retry writes.
- `opilot-hz24` (006): made Linux `journalctl` access robust to missing command (`ENOENT`) with graceful fallback diagnostics.
- `opilot-okwg` (007): replaced ad-hoc PowerShell literal usage with structured command-argument construction.
- `opilot-g2kb` (008): redacted URL credentials in user-facing connection error/log display paths.

Each child slice was validated with targeted tests and compile checks.
