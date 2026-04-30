import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Ollama } from 'ollama';
import type * as vscode from 'vscode';
import type { LocalModelsProvider } from './sidebar.js';
import type { DiagnosticsLogger } from './diagnostics.js';

// Mock vscode with our local test helper
vi.doMock('vscode', () => ({ ...(require('./test/vscode.mock') as Record<string, unknown>) }));

// Import the module under test after mocking
import { registerOpilotLmTools } from './lmTools';

describe('lmTools registration', () => {
  beforeEach(() => {
    // noop
  });

  it('registers expected tools (returns disposables)', async () => {
    const mockClient = {
      list: vi.fn().mockResolvedValue({ models: [{ name: 'llama2', size: 123 }] }),
      ps: vi.fn().mockResolvedValue({ models: [] }),
      pull: vi.fn().mockResolvedValue(undefined),
    } as unknown as Ollama;

    const mockLocalProvider = {
      startModel: vi.fn().mockResolvedValue(undefined),
      stopModel: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn(),
    } as unknown as LocalModelsProvider;

    const mockContext = { subscriptions: [] } as unknown as vscode.ExtensionContext;
    const mockDiagnostics = { exception: vi.fn(), info: vi.fn() } as unknown as DiagnosticsLogger;

    const disposables = registerOpilotLmTools(mockContext, mockClient, mockLocalProvider, mockDiagnostics);

    // The registration should return an array of disposables and also push them into context.subscriptions
    expect(Array.isArray(disposables)).toBe(true);
    expect(mockContext.subscriptions.length).toBeGreaterThanOrEqual(disposables.length);
  });
});
