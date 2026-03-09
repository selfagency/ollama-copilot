---
# ollama-models-vscode-xa1x
title: Migrate extension @ollama path to OpenAI transport
status: todo
type: task
priority: high
created_at: 2026-03-09T00:20:03Z
updated_at: 2026-03-09T00:20:07Z
parent: ollama-models-vscode-7d9m
---

Replace direct `effectiveClient.chat` in participant path with OpenAI-compat transport while preserving:

- tool invocation loops
- XML tool fallback
- thinking/response formatting
- error behavior
