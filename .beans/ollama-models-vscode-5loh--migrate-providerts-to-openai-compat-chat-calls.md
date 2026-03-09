---
# ollama-models-vscode-5loh
title: Migrate provider.ts to OpenAI-compat chat calls
status: todo
type: task
priority: high
created_at: 2026-03-09T00:20:03Z
updated_at: 2026-03-09T00:20:07Z
parent: ollama-models-vscode-7d9m
---

Replace provider SDK chat calls with OpenAI transport while preserving:

- thinking retries
- tools retries
- stream->fallback behavior
- cloud rescue ladder
- XML sanitation behavior
