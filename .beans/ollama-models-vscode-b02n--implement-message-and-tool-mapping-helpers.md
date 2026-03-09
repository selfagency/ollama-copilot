---
# ollama-models-vscode-b02n
title: Implement message and tool mapping helpers
status: todo
type: task
priority: high
created_at: 2026-03-09T00:20:03Z
updated_at: 2026-03-09T00:20:07Z
parent: ollama-models-vscode-7d9m
---

Add mapping layer for existing message/tool shapes to OpenAI chat-completions payload:

- role/content mapping
- vision parts mapping
- tool schema mapping
- tool result message mapping

Acceptance:

- parity with existing behavior for text/tools/images
