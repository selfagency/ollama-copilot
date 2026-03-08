---
# ollama-models-vscode-pr8a
title: XML tool call fallback for models that don't support JSON function calling
status: completed
type: feature
priority: high
created_at: 2026-03-08T20:26:06Z
updated_at: 2026-03-08T23:05:05Z
---

When Ollama's native JSON tool calling fails (isToolsNotSupportedError), instead of dropping tool access entirely, fall back to an XML tool call loop.

The XML approach (used by Cursor and Cline) prompts the model with human-readable XML instructions, parses `<tool_name><param>value</param></tool_name>` blocks from the streaming text output, and manually invokes `vscode.lm.invokeTool()` with the extracted parameters. This is especially important for small models like llama3.2 that reliably fail JSON constrained decoding.

## Todo

- [x] Add `buildXmlToolSystemPrompt(tools)` helper to `toolUtils.ts` — generates system prompt fragment listing available tools with XML call format and their parameter schemas
- [x] Add `extractXmlToolCalls(text)` parser to `toolUtils.ts` — parses `<tool_name><param>value</param></tool_name>` blocks from complete text, returns `{name, parameters}[]`
- [x] Wire XML fallback loop into `extension.ts` `handleChatRequest()` — triggered in the `isToolsNotSupportedError` branch, runs up to MAX_XML_ROUNDS using XML parse/invoke pattern
- [x] Add unit tests for `extractXmlToolCalls` covering happy path, nested params, malformed/partial XML, unknown tool names, fault-tolerant tag variants
- [x] Add unit tests for `buildXmlToolSystemPrompt` covering empty tools, tools with/without descriptions, required vs optional params
- [x] Improve `extractXmlToolCalls` fault tolerance — opening tags with spaces/attributes/newlines, closing tags with trailing whitespace
- [x] Improve `buildXmlToolSystemPrompt` — structured rules, concrete few-shot example, explicit anti-patterns
- [x] Fix tool result role in XML fallback — use `user` role with `[Tool result: name]` header instead of unsupported `tool` role
- [x] Tighten empty-response correction nudge message

## Summary of Changes

- **`src/toolUtils.ts`**: Added `buildXmlToolSystemPrompt()` (structured system prompt with numbered rules and a concrete few-shot example using the first tool), and `extractXmlToolCalls()` (regex-based parser with fault-tolerant opening/closing tag matching — allows spaces, attributes, newlines on the tag).
- **`src/extension.ts`**: XML fallback loop wired alongside the JSON tool loop (`useXmlFallback` flag triggers after `isToolsNotSupportedError`). Tool results use `role: 'user'` with `[Tool result: name]` header (small models lack `tool`-role training data). Empty-response correction nudge is now accurate and gives the model both branches.
- **`src/toolUtils.test.ts`**: 20 unit tests covering happy path, multiline values, empty params, fence stripping, prose prefix stripping, leading/trailing whitespace, unknown tools, and fault-tolerant tag variants (space before `>`, attributes, newline in tag, trailing whitespace in `</tag >`).
- **`src/extension.test.ts`**: Integration test covering the full XML fallback path (JSON tools error → XML system prompt injected → plain-text XML response rendered correctly).
