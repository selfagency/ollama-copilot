# Custom CodeQL Queries (JavaScript / TypeScript)

This pack adds repository-specific hardening checks for Node.js/TypeScript code.

## Queries

- `queries/child-process-shell-apis.ql`
  - Flags `exec`/`execSync` usage outside tests.
- `queries/innerhtml-assignment.ql`
  - Flags assignment to `innerHTML` outside tests.

## Why these checks

These checks focus on high-signal security hotspots that often benefit from stricter review in extensions and tooling codebases.
