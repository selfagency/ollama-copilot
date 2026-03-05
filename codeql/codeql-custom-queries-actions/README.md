# Custom CodeQL Queries (GitHub Actions)

This pack adds repository-specific hardening checks for workflow security.

## Queries

- `queries/strict-external-action-pinning.ql`
  - Flags external `uses:` steps that are not pinned to a full 40-character commit SHA.
- `queries/github-script-without-tojson.ql`
  - Flags `actions/github-script` steps whose `script` argument does not appear to use `toJson(...)`.

## Why these checks

These checks focus on practical workflow hardening against supply-chain and interpolation risks while keeping alerts actionable.
