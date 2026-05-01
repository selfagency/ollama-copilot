import * as vscode from 'vscode';
import type { Ollama, ModelResponse } from 'ollama';
import type { DiagnosticsLogger } from './diagnostics.js';
import type { LocalModelsProvider } from './sidebar.js';
import { fetchModelCapabilities, testConnection } from './client.js';

/**
 * Register a small set of Opilot language-model tools exposing read and
 * safe lifecycle operations for Ollama models. These tools are intentionally
 * conservative: heavy side-effects (delete) are omitted; start/stop/pull are
 * provided because they are explicit user-initiated lifecycle operations.
 */
export function registerOpilotLmTools(
  context: vscode.ExtensionContext,
  client: Ollama,
  localProvider: LocalModelsProvider,
  diagnostics?: DiagnosticsLogger,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Helper to wrap a JSON-serializable result into the VS Code LM return shape.
  const createLmToolResult = (payload: unknown) => {
    const jsonStr = JSON.stringify(payload);
    const textPart = new vscode.LanguageModelTextPart(jsonStr);
    return { content: [textPart] };
  };

  try {
    // List models
    const d1 = vscode.lm.registerTool(
      'opilot_list_models',
      {
        description: 'List all locally installed and cloud Ollama models',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      async (_input: Record<string, unknown>, _token: vscode.CancellationToken) => {
        try {
          const list = await client.list();
          const ps = await client.ps();
          const runningNames = new Set(ps.models.map((m: ModelResponse) => m.name));
          const mapped = list.models.map((m: ModelResponse) => ({
            id: m.name,
            size: m.size,
            downloaded: true,
            running: runningNames.has(m.name),
          }));
          return createLmToolResult(mapped);
        } catch (error) {
          diagnostics?.exception?.('[lm-tools] opilot_list_models failed', error);
          return createLmToolResult({ error: error instanceof Error ? error.message : String(error) });
        }
      },
    );
    disposables.push(d1);

    // Get model info
    const d2 = vscode.lm.registerTool(
      'opilot_get_model_info',
      {
        description: 'Return capabilities and metadata for a specific Ollama model',
        inputSchema: {
          type: 'object',
          properties: { modelId: { type: 'string' } },
          required: ['modelId'],
          additionalProperties: false,
        },
      },
      async (input: Record<string, unknown>, _token: vscode.CancellationToken) => {
        try {
          const modelId = typeof input.modelId === 'string' ? input.modelId : '';
          if (!modelId) return createLmToolResult({ error: 'missing modelId' });
          const caps = await fetchModelCapabilities(client, modelId);
          return createLmToolResult({ modelId, capabilities: caps });
        } catch (error) {
          diagnostics?.exception?.('[lm-tools] opilot_get_model_info failed', error);
          return createLmToolResult({ error: error instanceof Error ? error.message : String(error) });
        }
      },
    );
    disposables.push(d2);

    // Check server health
    const d3 = vscode.lm.registerTool(
      'opilot_check_server_health',
      {
        description: 'Check whether the configured Ollama server is reachable',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      async (_input: Record<string, unknown>, _token: vscode.CancellationToken) => {
        try {
          const ok = await testConnection(client, 5000);
          const host = (client as unknown as { config: { host: string } }).config?.host ?? null;
          return createLmToolResult({ reachable: !!ok, host });
        } catch (error) {
          diagnostics?.exception?.('[lm-tools] opilot_check_server_health failed', error);
          return createLmToolResult({
            reachable: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    );
    disposables.push(d3);

    // Pull model (long running) — perform a direct pull without interactive UI.
    // Note: this downloads synchronously (stream: false) to simplify tool semantics.
    const d4 = vscode.lm.registerTool(
      'opilot_pull_model',
      {
        description: 'Pull (download) a model from the Ollama library to the local machine',
        inputSchema: {
          type: 'object',
          properties: { modelId: { type: 'string' } },
          required: ['modelId'],
          additionalProperties: false,
        },
      },
      async (input: Record<string, unknown>, _token: vscode.CancellationToken) => {
        try {
          const modelId = typeof input.modelId === 'string' ? input.modelId : '';
          if (!modelId) return createLmToolResult({ error: 'missing modelId' });
          await client.pull({ model: modelId, stream: false });
          try {
            localProvider.refresh();
          } catch {
            // best-effort
          }
          return createLmToolResult({ pulled: true, modelId });
        } catch (error) {
          diagnostics?.exception?.('[lm-tools] opilot_pull_model failed', error);
          return createLmToolResult({ error: error instanceof Error ? error.message : String(error) });
        }
      },
    );
    disposables.push(d4);

    // Start model (warm)
    const d5 = vscode.lm.registerTool(
      'opilot_start_model',
      {
        description: 'Start (warm) a locally-installed or cloud model',
        inputSchema: {
          type: 'object',
          properties: { modelId: { type: 'string' } },
          required: ['modelId'],
          additionalProperties: false,
        },
      },
      async (input: Record<string, unknown>, _token: vscode.CancellationToken) => {
        try {
          const modelId = typeof input.modelId === 'string' ? input.modelId : '';
          if (!modelId) return createLmToolResult({ error: 'missing modelId' });
          // Use the LocalModelsProvider API directly (safe and idempotent)
          await localProvider.startModel(modelId);
          return createLmToolResult({ started: true, modelId });
        } catch (error) {
          diagnostics?.exception?.('[lm-tools] opilot_start_model failed', error);
          return createLmToolResult({ error: error instanceof Error ? error.message : String(error) });
        }
      },
    );
    disposables.push(d5);

    // Stop model
    const d6 = vscode.lm.registerTool(
      'opilot_stop_model',
      {
        description: 'Stop (unload) a running model',
        inputSchema: {
          type: 'object',
          properties: { modelId: { type: 'string' } },
          required: ['modelId'],
          additionalProperties: false,
        },
      },
      async (input: Record<string, unknown>, _token: vscode.CancellationToken) => {
        try {
          const modelId = typeof input.modelId === 'string' ? input.modelId : '';
          if (!modelId) return createLmToolResult({ error: 'missing modelId' });
          await localProvider.stopModel(modelId);
          return createLmToolResult({ stopped: true, modelId });
        } catch (error) {
          diagnostics?.exception?.('[lm-tools] opilot_stop_model failed', error);
          return createLmToolResult({ error: error instanceof Error ? error.message : String(error) });
        }
      },
    );
    disposables.push(d6);
  } catch (err) {
    diagnostics?.exception?.('[lm-tools] failed to register tools', err);
  }

  for (const d of disposables) context.subscriptions.push(d);
  return disposables;
}
