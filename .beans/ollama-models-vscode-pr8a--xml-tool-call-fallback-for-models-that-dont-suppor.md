---
# ollama-models-vscode-pr8a
title: XML tool call fallback for models that don't support JSON function calling
status: in-progress
type: feature
priority: high
created_at: 2026-03-08T20:26:06Z
updated_at: 2026-03-08T20:26:24Z
---

When Ollama's native JSON tool calling fails (isToolsNotSupportedError), instead of dropping tool access entirely, fall back to an XML tool call loop.

The XML approach (used by Cursor and Cline) prompts the model with human-readable XML instructions, parses `<tool_name><param>value</param></tool_name>` blocks from the streaming text output, and manually invokes `vscode.lm.invokeTool()` with the extracted parameters. This is especially important for small models like llama3.2 that reliably fail JSON constrained decoding.

## Todo

- [ ] Add `buildXmlToolSystemPrompt(tools)` helper to `toolUtils.ts` — generates system prompt fragment listing available tools with XML call format and their parameter schemas
- [ ] Add `extractXmlToolCalls(text)` parser to `toolUtils.ts` — parses `<tool_name><param>value</param></tool_name>` blocks from complete text, returns `{name, parameters}[]`
- [ ] Add `createXmlToolCallStreamExtractor()` to `formatting.ts` — streaming variant that buffers potential tool-call blocks from SAX events and emits them when complete, passes non-tool text through
- [ ] Wire XML fallback loop into `extension.ts` `handleChatRequest()` — triggered in the `isToolsNotSupportedError` branch, runs up to MAX_TOOL_ROUNDS using XML parse/invoke pattern
- [ ] Add unit tests for `extractXmlToolCalls` covering happy path, nested params, malformed/partial XML, unknown tool names
- [ ] Add unit tests for `buildXmlToolSystemPrompt` covering empty tools, tools with/without descriptions, required vs optional params
