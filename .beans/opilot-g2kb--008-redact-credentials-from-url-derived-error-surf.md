---
# opilot-g2kb
title: 008 Redact credentials from URL-derived error surfaces
status: completed
type: bug
priority: low
created_at: 2026-04-14T21:38:28Z
updated_at: 2026-04-15T00:22:00Z
parent: opilot-yva4
id: opilot-g2kb
---

Source issue 008 from `docs/plans/remediation-plan.md`.

## Summary

Connection errors derived from URLs can leak credential-bearing host strings into dialogs or logs.

## Files

- `src/client.ts`
- any shared URL/error formatting helpers involved in connection testing

## Remediation Goal

Ensure hosts and URLs are sanitized before they reach logs, thrown errors, or VS Code notifications.

## Todo

- [x] Trace how host configuration is transformed into displayed error messages
- [x] Introduce a safe redaction helper for credential-bearing URLs
- [x] Apply the helper consistently in connection and transport error paths
- [x] Add tests covering authenticated and unauthenticated host formats
- [x] Verify diagnostics remain useful without exposing secrets

## Summary of Changes

Implemented credential redaction for host/URL display paths:

- Added `redactUrlCredentials()` in `src/client.ts`.
- Added `redactDisplayHost()` in `src/extensionHelpers.ts` and applied it in connection-failure dialogs and remote-log guidance messages.
- Updated `src/extension.ts` configured-host diagnostics logging to use redacted display host.

Added/updated tests:

- `src/client.test.ts`: redaction behavior for authenticated, unauthenticated, and invalid URL strings.
- `src/extension.test.ts`: verifies connection error messaging redacts embedded credentials.

Validation run:

- `pnpm vitest run src/client.test.ts src/extension.test.ts src/extension.utils.test.ts`
- `pnpm run compile`
