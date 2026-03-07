# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `LanguageModelChatProvider` registration under vendor `selfagency-ollama`, making local Ollama models available in GitHub Copilot Chat and the VS Code model picker
- `@ollama` chat participant (`ollama-copilot.ollama`) with history-aware direct streaming to the Ollama API
- Tool calling support for compatible models (e.g. `qwen2.5`, `llama3.1`) via the VS Code LM tool API; all models advertise `toolCalling: true` for picker visibility
- Vision / multimodal image input support
- Thinking model support — automatically retries with `think: false` when the model does not support extended thinking
- Model management sidebar with three panels: **Local Models**, **Library Models**, and **Cloud Models** (requires API key)
- Model capability badges (tool calling, vision, context window size)
- Streaming pull progress shown in the sidebar when downloading models from the library (`ollama-copilot.pullModelFromLibrary`)
- **Modelfile Manager** sidebar pane with syntax highlighting, hover documentation, and autocomplete for Modelfile instructions
- Inline code completion provider (fill-in-middle) for all locally running Ollama models
- Library model panel with collapsible variant children; supports newest-first sorting (`?sort=newest`)
- Key-icon auth token management button in panel headers (`ollama-copilot.manageAuthToken`)
- Remote Ollama instance support with configurable host URL and Bearer token stored in VS Code secrets
- Log streaming from the Ollama server process (macOS, Linux, Windows)
- Conflict detection: optionally removes the VS Code built-in Ollama provider entry if this extension is active
- Per-request Ollama client instantiation so host/token changes take effect immediately
- Model list caching with a 5-second throttle and 6-hour background refresh for model info
- `Ollama` category applied to all contributed commands

### Fixed

- Non-tool-calling models now appear in the VS Code model picker (resolved by advertising `toolCalling: true` unconditionally; native support tracked separately)
- LM response streamed per-token rather than buffered to a single chunk
- Cloud model run flow: pull model before start; model name suffixes applied correctly
