---
# ollama-models-vscode-7d9m
title: Migrate LLM interactions to OpenAI-compat transport (no flag)
status: in-progress
type: epic
priority: high
created_at: 2026-03-09T00:19:52Z
updated_at: 2026-03-09T00:19:52Z
---

## Goal

Migrate chat/completion transport to Ollama OpenAI-compat HTTP endpoints while preserving Ollama SDK usage for sidebar/model-management.

## Todo

- [ ] Create shared OpenAI-compat transport (SSE + non-stream)
- [ ] Add message/tool mapping helpers
- [ ] Migrate provider chat path
- [ ] Migrate @ollama participant path
- [ ] Update client auth/host plumbing
- [ ] Expand tests for new transport and parity
- [ ] Run full validation and compile

## Notes

- No feature flag (pre-release product per user decision)
- Preserve existing XML sanitation behavior
