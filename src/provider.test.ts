import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LanguageModelChatMessageRole,
  LanguageModelDataPart,
  LanguageModelTextPart,
  LanguageModelToolCallPart,
  LanguageModelToolResultPart,
  window,
} from 'vscode';
import { formatModelName, getChatModelInfo, MistralChatModelProvider, toMistralRole } from './provider.js';

// ── Shared mock context ───────────────────────────────────────────────────────

const mockContext = {
  secrets: {
    get: vi.fn().mockResolvedValue(undefined),
    store: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    onDidChange: vi.fn(),
  },
  subscriptions: [],
} as any;

// ── formatModelName ───────────────────────────────────────────────────────────

describe('formatModelName', () => {
  it('capitalises a single segment', () => {
    expect(formatModelName('mistral')).toBe('Mistral');
  });

  it('capitalises each hyphen-separated segment', () => {
    expect(formatModelName('mistral-large-latest')).toBe('Mistral Large Latest');
  });

  it('handles numeric segments without error', () => {
    expect(formatModelName('devstral-small-2505')).toBe('Devstral Small 2505');
  });
});

// ── getChatModelInfo ──────────────────────────────────────────────────────────

describe('getChatModelInfo', () => {
  const base = {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    maxInputTokens: 128000,
    maxOutputTokens: 16384,
    defaultCompletionTokens: 65536,
    toolCalling: true,
    supportsParallelToolCalls: true,
    supportsVision: true,
  };

  it('maps all fields correctly', () => {
    const info = getChatModelInfo(base);
    expect(info.id).toBe('mistral-large-latest');
    expect(info.name).toBe('Mistral Large');
    expect(info.family).toBe('mistral');
    expect(info.maxInputTokens).toBe(128000);
    expect(info.maxOutputTokens).toBe(16384);
    expect(info.capabilities?.toolCalling).toBe(true);
    expect(info.capabilities?.imageInput).toBe(true);
  });

  it('tooltip is omitted so detail field is shown in the chat picker', () => {
    const info = getChatModelInfo({ ...base, detail: 'Latest flagship' });
    expect(info.tooltip).toBeUndefined();
  });

  it('imageInput is false when supportsVision is false', () => {
    const info = getChatModelInfo({ ...base, supportsVision: false });
    expect(info.capabilities?.imageInput).toBe(false);
  });

  it('imageInput is false when supportsVision is undefined', () => {
    const { supportsVision: _, ...noVision } = base;
    const info = getChatModelInfo(noVision as any);
    expect(info.capabilities?.imageInput).toBe(false);
  });
});

// ── toMistralRole ─────────────────────────────────────────────────────────────

describe('toMistralRole', () => {
  it('maps User to "user"', () => {
    expect(toMistralRole(LanguageModelChatMessageRole.User)).toBe('user');
  });

  it('maps Assistant to "assistant"', () => {
    expect(toMistralRole(LanguageModelChatMessageRole.Assistant)).toBe('assistant');
  });

  it('maps unknown values to "user"', () => {
    expect(toMistralRole(99 as any)).toBe('user');
  });
});

// ── Tool call ID mapping ──────────────────────────────────────────────────────

describe('MistralChatModelProvider — tool call ID mapping', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext);
  });

  describe('generateToolCallId', () => {
    it('returns a 9-character string', () => {
      expect(provider.generateToolCallId()).toHaveLength(9);
    });

    it('returns only alphanumeric characters', () => {
      const id = provider.generateToolCallId();
      expect(id).toMatch(/^[a-zA-Z0-9]{9}$/);
    });

    it('produces unique IDs across calls', () => {
      const ids = new Set(Array.from({ length: 20 }, () => provider.generateToolCallId()));
      expect(ids.size).toBeGreaterThan(1);
    });
  });

  describe('getOrCreateVsCodeToolCallId', () => {
    it('returns a 9-character alphanumeric ID for a new Mistral ID', () => {
      const id = provider.getOrCreateVsCodeToolCallId('mistral-abc');
      expect(id).toMatch(/^[a-zA-Z0-9]{9}$/);
    });

    it('returns the same VS Code ID for the same Mistral ID (idempotent)', () => {
      const first = provider.getOrCreateVsCodeToolCallId('mistral-abc');
      const second = provider.getOrCreateVsCodeToolCallId('mistral-abc');
      expect(first).toBe(second);
    });

    it('creates distinct VS Code IDs for different Mistral IDs', () => {
      const a = provider.getOrCreateVsCodeToolCallId('mistral-aaa');
      const b = provider.getOrCreateVsCodeToolCallId('mistral-bbb');
      expect(a).not.toBe(b);
    });

    it('registers the bidirectional mapping so getMistralToolCallId resolves back', () => {
      const vsCodeId = provider.getOrCreateVsCodeToolCallId('mistral-xyz');
      expect(provider.getMistralToolCallId(vsCodeId)).toBe('mistral-xyz');
    });
  });

  describe('getMistralToolCallId', () => {
    it('returns the Mistral ID for a known VS Code ID', () => {
      const vsCodeId = provider.getOrCreateVsCodeToolCallId('mistral-known');
      expect(provider.getMistralToolCallId(vsCodeId)).toBe('mistral-known');
    });

    it('returns undefined for an unknown VS Code ID', () => {
      expect(provider.getMistralToolCallId('unknown-id')).toBeUndefined();
    });

    it('returns the Mistral ID for a known VS Code ID', () => {
      const mistralId = 'mistral-id-1';
      const vsCodeId = provider.getOrCreateVsCodeToolCallId(mistralId);

      const result = provider.getMistralToolCallId(vsCodeId);
      expect(result).toBe(mistralId);
    });

    it('returns undefined for an unknown VS Code ID', () => {
      const result = provider.getMistralToolCallId('unknown-id');
      expect(result).toBeUndefined();
    });

    it('handles empty VS Code ID', () => {
      const result = provider.getMistralToolCallId('');
      expect(result).toBeUndefined();
    });

    it('handles VS Code ID with special characters', () => {
      const result = provider.getMistralToolCallId('vs-code-id-!@#$%^&*()');
      expect(result).toBeUndefined();
    });
  });

  describe('clearToolCallIdMappings', () => {
    it('makes previously mapped IDs no longer resolvable', () => {
      const vsCodeId = provider.getOrCreateVsCodeToolCallId('mistral-to-clear');
      provider.clearToolCallIdMappings();
      expect(provider.getMistralToolCallId(vsCodeId)).toBeUndefined();
    });

    it('subsequent getOrCreate after clear creates a fresh (possibly different) ID', () => {
      const before = provider.getOrCreateVsCodeToolCallId('mistral-refresh');
      provider.clearToolCallIdMappings();
      const after = provider.getOrCreateVsCodeToolCallId('mistral-refresh');
      expect(after).toMatch(/^[a-zA-Z0-9]{9}$/);
      expect(provider.getMistralToolCallId(before)).toBeUndefined();
    });
  });
});

// ── fetchModels ───────────────────────────────────────────────────────────────

describe('MistralChatModelProvider — fetchModels', () => {
  let provider: MistralChatModelProvider;

  const chatModel = {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    description: 'Flagship model',
    maxContextLength: 128000,
    defaultModelTemperature: 0.7,
    capabilities: { completionChat: true, functionCalling: true, vision: true },
  };

  const embedModel = {
    id: 'mistral-embed',
    name: null,
    description: null,
    maxContextLength: 8192,
    defaultModelTemperature: null,
    capabilities: { completionChat: false, functionCalling: false, vision: false },
  };

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext);
  });

  it('returns empty array when no client is set', async () => {
    const models = await provider.fetchModels();
    expect(models).toEqual([]);
  });

  it('filters out models without completionChat capability', async () => {
    const mockList = vi.fn().mockResolvedValue({ data: [chatModel, embedModel] });
    (provider as any).client = { models: { list: mockList } };

    const models = await provider.fetchModels();
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('mistral-large-latest');
  });

  it('maps API fields to MistralModel correctly', async () => {
    const mockList = vi.fn().mockResolvedValue({ data: [chatModel] });
    (provider as any).client = { models: { list: mockList } };

    const [model] = await provider.fetchModels();
    expect(model.name).toBe('Mistral Large');
    expect(model.detail).toBe('Flagship model');
    expect(model.maxInputTokens).toBe(128000);
    expect(model.toolCalling).toBe(true);
    expect(model.supportsParallelToolCalls).toBe(true);
    expect(model.supportsVision).toBe(true);
    expect(model.temperature).toBe(0.7);
  });

  it('falls back to formatModelName when name is null', async () => {
    const noName = { ...chatModel, name: null };
    const mockList = vi.fn().mockResolvedValue({ data: [noName] });
    (provider as any).client = { models: { list: mockList } };

    const [model] = await provider.fetchModels();
    expect(model.name).toBe('Mistral Large Latest');
  });

  it('caches the result — second call does not hit the API', async () => {
    const mockList = vi.fn().mockResolvedValue({ data: [chatModel] });
    (provider as any).client = { models: { list: mockList } };

    await provider.fetchModels();
    await provider.fetchModels();
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it('returns empty array and does not throw on API error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockList = vi.fn().mockRejectedValue(new Error('network error'));
    (provider as any).client = { models: { list: mockList } };

    const models = await provider.fetchModels();
    expect(models).toEqual([]);
  });

  it('fires onDidChangeLanguageModelChatInformation after a successful fetch', async () => {
    const mockList = vi.fn().mockResolvedValue({ data: [chatModel] });
    (provider as any).client = { models: { list: mockList } };

    const listener = vi.fn();
    provider.onDidChangeLanguageModelChatInformation(listener);

    await provider.fetchModels();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not fire onDidChangeLanguageModelChatInformation when serving from cache', async () => {
    const mockList = vi.fn().mockResolvedValue({ data: [chatModel] });
    (provider as any).client = { models: { list: mockList } };

    const listener = vi.fn();
    provider.onDidChangeLanguageModelChatInformation(listener);

    await provider.fetchModels();
    await provider.fetchModels();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not fire onDidChangeLanguageModelChatInformation on API error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockList = vi.fn().mockRejectedValue(new Error('network error'));
    (provider as any).client = { models: { list: mockList } };

    const listener = vi.fn();
    provider.onDidChangeLanguageModelChatInformation(listener);

    await provider.fetchModels();
    expect(listener).not.toHaveBeenCalled();
  });

  it('cache is cleared when fetchedModels is reset to null', async () => {
    const mockList = vi.fn().mockResolvedValue({ data: [chatModel] });
    (provider as any).client = { models: { list: mockList } };
    await provider.fetchModels();

    (provider as any).fetchedModels = null;
    (provider as any).client = { models: { list: mockList } };

    await provider.fetchModels();
    expect(mockList).toHaveBeenCalledTimes(2);
  });
});

// ── Fetch Models Edge Cases ──────────────────────────────────────────────

describe('Fetch Models Edge Cases', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should handle API failure during model fetch', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockList = vi.fn().mockRejectedValue(new Error('API error'));
    (provider as any).client = { models: { list: mockList } };

    const models = await provider.fetchModels();
    expect(models).toEqual([]);
  });

  it('should handle empty model list from API', async () => {
    const mockList = vi.fn().mockResolvedValue({ data: [] });
    (provider as any).client = { models: { list: mockList } };

    const models = await provider.fetchModels();
    expect(models).toEqual([]);
  });

  it('should handle models without completionChat capability', async () => {
    const mockList = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'test-model',
          name: 'Test Model',
          description: 'Test Description',
          maxContextLength: 1000,
          defaultModelTemperature: 0.7,
          capabilities: { completionChat: false, functionCalling: false, vision: false },
        },
      ],
    });
    (provider as any).client = { models: { list: mockList } };

    const models = await provider.fetchModels();
    expect(models).toEqual([]);
  });

  it('should handle models with missing fields', async () => {
    const mockList = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'test-model',
          name: null,
          description: null,
          maxContextLength: null,
          defaultModelTemperature: null,
          capabilities: { completionChat: true, functionCalling: false, vision: false },
        },
      ],
    });
    (provider as any).client = { models: { list: mockList } };

    const models = await provider.fetchModels();
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe('Test Model');
  });
});

// ── toMistralMessages ─────────────────────────────────────────────────────────

describe('MistralChatModelProvider — toMistralMessages', () => {
  let provider: MistralChatModelProvider;

  function userMsg(...parts: any[]) {
    return { role: LanguageModelChatMessageRole.User, content: parts, name: undefined };
  }
  function assistantMsg(...parts: any[]) {
    return { role: LanguageModelChatMessageRole.Assistant, content: parts, name: undefined };
  }

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext);
  });

  it('converts a plain text user message', () => {
    const msgs = provider.toMistralMessages([userMsg(new LanguageModelTextPart('Hello'))]);
    expect(msgs).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  it('concatenates multiple text parts into one string', () => {
    const msgs = provider.toMistralMessages([
      userMsg(new LanguageModelTextPart('Hello'), new LanguageModelTextPart(' world')),
    ]);
    expect(msgs).toEqual([{ role: 'user', content: 'Hello world' }]);
  });

  it('converts a plain text assistant message', () => {
    const msgs = provider.toMistralMessages([assistantMsg(new LanguageModelTextPart('Hi'))]);
    expect(msgs).toEqual([{ role: 'assistant', content: 'Hi', toolCalls: undefined }]);
  });

  it('skips empty user messages', () => {
    const msgs = provider.toMistralMessages([userMsg()]);
    expect(msgs).toHaveLength(0);
  });

  it('skips empty assistant messages (no content, no tool calls)', () => {
    const msgs = provider.toMistralMessages([assistantMsg()]);
    expect(msgs).toHaveLength(0);
  });

  it('converts an assistant message with a tool call', () => {
    const toolCall = new LanguageModelToolCallPart('vsCode-id-1', 'search_files', { query: 'foo' });
    const msgs = provider.toMistralMessages([assistantMsg(toolCall)]);

    expect(msgs).toHaveLength(1);
    const msg = msgs[0] as any;
    expect(msg.role).toBe('assistant');
    expect(msg.content).toBeNull();
    expect(msg.toolCalls).toHaveLength(1);
    expect(msg.toolCalls[0].type).toBe('function');
    expect(msg.toolCalls[0].function.name).toBe('search_files');
    expect(JSON.parse(msg.toolCalls[0].function.arguments)).toEqual({ query: 'foo' });
  });

  it('converts a tool result message into role="tool"', () => {
    const toolCall = new LanguageModelToolCallPart('vsCode-id-2', 'read_file', { path: '/foo' });
    const toolResult = new LanguageModelToolResultPart('vsCode-id-2', [new LanguageModelTextPart('file contents')]);

    const msgs = provider.toMistralMessages([assistantMsg(toolCall), userMsg(toolResult)]);

    const toolMsg = msgs.find((m: any) => m.role === 'tool') as any;
    expect(toolMsg).toBeDefined();
    expect(toolMsg.content).toBe('file contents');
    expect(typeof toolMsg.toolCallId).toBe('string');
  });

  it('uses text content for tool result when available', () => {
    const toolCall = new LanguageModelToolCallPart('id-3', 'fn', {});
    const toolResult = new LanguageModelToolResultPart('id-3', [new LanguageModelTextPart('result text')]);

    const msgs = provider.toMistralMessages([assistantMsg(toolCall), userMsg(toolResult)]);
    const toolMsg = msgs.find((m: any) => m.role === 'tool') as any;
    expect(toolMsg.content).toBe('result text');
  });

  it('encodes image data parts as base64 imageUrl chunks', () => {
    const imageData = new Uint8Array([1, 2, 3]);
    const imgPart = new LanguageModelDataPart(imageData, 'image/png');
    const msgs = provider.toMistralMessages([userMsg(imgPart)]);

    expect(msgs).toHaveLength(1);
    const content = (msgs[0] as any).content as any[];
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe('image_url');
    expect(content[0].imageUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('stringifies non-image data parts as text placeholder', () => {
    const dataPart = new LanguageModelDataPart(new Uint8Array([0]), 'application/pdf');
    const msgs = provider.toMistralMessages([userMsg(dataPart)]);

    expect(msgs).toHaveLength(1);
    expect((msgs[0] as any).content).toBe('[data:application/pdf]');
  });

  it('includes both text and image in a multimodal message', () => {
    const imageData = new Uint8Array([9, 8, 7]);
    const msgs = provider.toMistralMessages([
      userMsg(new LanguageModelTextPart('Look at this:'), new LanguageModelDataPart(imageData, 'image/jpeg')),
    ]);

    const content = (msgs[0] as any).content as any[];
    expect(content[0]).toEqual({ type: 'text', text: 'Look at this:' });
    expect(content[1].type).toBe('image_url');
  });

  it('assistant message with both text and tool calls includes both', () => {
    const toolCall = new LanguageModelToolCallPart('id-4', 'fn', {});
    const msgs = provider.toMistralMessages([assistantMsg(new LanguageModelTextPart('thinking...'), toolCall)]);

    const msg = msgs[0] as any;
    expect(msg.content).toBe('thinking...');
    expect(msg.toolCalls).toHaveLength(1);
  });
});

// ── toMistralMessages Edge Cases ────────────────────────────────────────────

describe('toMistralMessages Edge Cases', () => {
  let provider: MistralChatModelProvider;

  function userMsg(...parts: any[]) {
    return { role: LanguageModelChatMessageRole.User, content: parts, name: undefined };
  }
  function assistantMsg(...parts: any[]) {
    return { role: LanguageModelChatMessageRole.Assistant, content: parts, name: undefined };
  }

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should handle messages with mixed content types', () => {
    const textPart = new LanguageModelTextPart('Hello');
    const toolCall = new LanguageModelToolCallPart('test-id', 'test-function', { key: 'value' });
    const msgs = provider['toMistralMessages']([assistantMsg(textPart, toolCall)]);

    expect(msgs).toHaveLength(1);
    const msg = msgs[0] as any;
    expect(msg.role).toBe('assistant');
    expect(msg.content).toBe('Hello');
    expect(msg.toolCalls).toHaveLength(1);
  });

  it('should handle messages with multiple tool results', () => {
    const toolCall1 = new LanguageModelToolCallPart('test-id-1', 'test-function-1', { key: 'value' });
    const toolResult1 = new LanguageModelToolResultPart('test-id-1', [new LanguageModelTextPart('result1')]);
    const toolCall2 = new LanguageModelToolCallPart('test-id-2', 'test-function-2', { key: 'value' });
    const toolResult2 = new LanguageModelToolResultPart('test-id-2', [new LanguageModelTextPart('result2')]);

    const msgs = provider['toMistralMessages']([assistantMsg(toolCall1, toolCall2), userMsg(toolResult1, toolResult2)]);

    const toolMsgs = msgs.filter((m: any) => m.role === 'tool');
    expect(toolMsgs).toHaveLength(2);
  });

  it('should handle messages with image and text content', () => {
    const imageData = new Uint8Array([1, 2, 3]);
    const imgPart = new LanguageModelDataPart(imageData, 'image/png');
    const textPart = new LanguageModelTextPart('Look at this:');
    const msgs = provider['toMistralMessages']([userMsg(textPart, imgPart)]);

    expect(msgs).toHaveLength(1);
    const content = (msgs[0] as any).content as any[];
    expect(content).toHaveLength(2);
    expect(content[0]).toEqual({ type: 'text', text: 'Look at this:' });
    expect(content[1].type).toBe('image_url');
  });

  it('should handle messages with non-image data parts', () => {
    const dataPart = new LanguageModelDataPart(new Uint8Array([0]), 'application/pdf');
    const msgs = provider['toMistralMessages']([userMsg(dataPart)]);

    expect(msgs).toHaveLength(1);
    expect((msgs[0] as any).content).toBe('[data:application/pdf]');
  });
});

// ── setApiKey ──────────────────────────────────────────────────────────────

describe('setApiKey', () => {
  it('should prompt for API key and store it', async () => {
    const mockApiKey = 'test-api-key';
    vi.spyOn(window, 'showInputBox').mockResolvedValue(mockApiKey);
    vi.spyOn(mockContext.secrets, 'store').mockResolvedValue(undefined);

    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    const result = await provider.setApiKey();
    expect(result).toBe(mockApiKey);
    expect(window.showInputBox).toHaveBeenCalled();
    expect(mockContext.secrets.store).toHaveBeenCalledWith('MISTRAL_API_KEY', mockApiKey);
  });

  it('should handle cancellation by user', async () => {
    vi.spyOn(window, 'showInputBox').mockResolvedValue(undefined);

    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    const result = await provider.setApiKey();
    expect(result).toBeUndefined();
  });

  it('should accept API key even if it is short', async () => {
    const shortApiKey = 'short';
    vi.spyOn(window, 'showInputBox').mockResolvedValue(shortApiKey);
    vi.spyOn(mockContext.secrets, 'store').mockResolvedValue(undefined);

    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    const result = await provider.setApiKey();
    expect(result).toBe(shortApiKey);
  });
});

// ── Set API Key Edge Cases ──────────────────────────────────────────────

describe('Set API Key Edge Cases', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should handle API key storage failure', async () => {
    const mockApiKey = 'test-api-key';
    vi.spyOn(window, 'showInputBox').mockResolvedValue(mockApiKey);
    vi.spyOn(mockContext.secrets, 'store').mockRejectedValue(new Error('Storage error'));

    const result = await provider.setApiKey();
    expect(result).toBe(mockApiKey);
  });

  it('should handle empty API key input', async () => {
    vi.spyOn(window, 'showInputBox').mockResolvedValue('');

    const result = await provider.setApiKey();
    expect(result).toBeUndefined();
  });

  it('should handle API key with leading and trailing spaces', async () => {
    const mockApiKey = '  test-api-key  ';
    vi.spyOn(window, 'showInputBox').mockResolvedValue(mockApiKey);
    vi.spyOn(mockContext.secrets, 'store').mockResolvedValue(undefined);

    const result = await provider.setApiKey();
    expect(result).toBe(mockApiKey);
  });

  it('should handle API key with special characters', async () => {
    const mockApiKey = 'test-api-key-!@#$%^&*()';
    vi.spyOn(window, 'showInputBox').mockResolvedValue(mockApiKey);
    vi.spyOn(mockContext.secrets, 'store').mockResolvedValue(undefined);

    const result = await provider.setApiKey();
    expect(result).toBe(mockApiKey);
  });
});

// ── Model Selection Logic ──────────────────────────────────────────────────

describe('Model Selection Logic', () => {
  it('should select the model with the largest context size', () => {
    const models = [
      { id: 'model1', maxInputTokens: 1000 },
      { id: 'model2', maxInputTokens: 2000 },
      { id: 'model3', maxInputTokens: 1500 },
    ];
    const bestModel = models.reduce((best, current) => {
      return (current.maxInputTokens ?? 0) > (best.maxInputTokens ?? 0) ? current : best;
    });
    expect(bestModel.id).toBe('model2');
  });
});

// ── Initialization Logic ──────────────────────────────────────────────────

describe('Initialization Logic', () => {
  it('should initialize client with stored API key', async () => {
    const mockApiKey = 'test-api-key';
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(mockApiKey);

    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    const result = await provider['initClient'](true);
    expect(result).toBe(true);
  });

  it('should prompt for API key if not stored', async () => {
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(undefined);
    const mockApiKey = 'test-api-key';
    vi.spyOn(window, 'showInputBox').mockResolvedValue(mockApiKey);
    vi.spyOn(mockContext.secrets, 'store').mockResolvedValue(undefined);

    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    const result = await provider['initClient'](false);
    expect(result).toBe(true);
    expect(window.showInputBox).toHaveBeenCalled();
  });
});

// ── Initialization Edge Cases ────────────────────────────────────────────

describe('Initialization Edge Cases', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should handle initialization with stored API key', async () => {
    const mockApiKey = 'test-api-key';
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(mockApiKey);

    const result = await provider['initClient'](true);
    expect(result).toBe(true);
  });

  it('should handle initialization without stored API key and silent mode', async () => {
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(undefined);

    const result = await provider['initClient'](true);
    expect(result).toBe(false);
  });

  it('should handle initialization with user cancellation', async () => {
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(undefined);
    vi.spyOn(window, 'showInputBox').mockResolvedValue(undefined);

    const result = await provider['initClient'](false);
    expect(result).toBe(false);
  });

  it('should handle initialization with user-provided API key', async () => {
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(undefined);
    const mockApiKey = 'test-api-key';
    vi.spyOn(window, 'showInputBox').mockResolvedValue(mockApiKey);
    vi.spyOn(mockContext.secrets, 'store').mockResolvedValue(undefined);

    const result = await provider['initClient'](false);
    expect(result).toBe(true);
    expect(mockContext.secrets.store).toHaveBeenCalledWith('MISTRAL_API_KEY', mockApiKey);
  });
});

// ── Model Information Provision ────────────────────────────────────────────

describe('Model Information Provision', () => {
  it('should provide model information', async () => {
    const mockApiKey = 'test-api-key';
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(mockApiKey);

    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    await provider['initClient'](true);

    const mockCancellationToken = { isCancellationRequested: false, onCancellationRequested: vi.fn() };
    const models = await provider.provideLanguageModelChatInformation({ silent: true }, mockCancellationToken as any);
    expect(models).toBeDefined();
  });
});

// ── Model Information Edge Cases ──────────────────────────────────────────

describe('Model Information Edge Cases', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should handle initialization failure silently', async () => {
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(undefined);
    vi.spyOn(window, 'showInputBox').mockResolvedValue(undefined);

    const mockCancellationToken = { isCancellationRequested: false, onCancellationRequested: vi.fn() };
    const models = await provider.provideLanguageModelChatInformation({ silent: true }, mockCancellationToken as any);

    expect(models).toEqual([]);
  });

  it('should handle API failure during model fetch', async () => {
    const mockApiKey = 'test-api-key';
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(mockApiKey);

    await provider['initClient'](true);

    // Mock the client to throw an error
    (provider as any).client = {
      models: {
        list: vi.fn().mockRejectedValue(new Error('API error')),
      },
    };

    const mockCancellationToken = { isCancellationRequested: false, onCancellationRequested: vi.fn() };
    const models = await provider.provideLanguageModelChatInformation({ silent: true }, mockCancellationToken as any);

    expect(models).toEqual([]);
  });

  it('should handle empty model list from API', async () => {
    const mockApiKey = 'test-api-key';
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(mockApiKey);

    await provider['initClient'](true);

    // Mock the client to return an empty list
    (provider as any).client = {
      models: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
    };

    const mockCancellationToken = { isCancellationRequested: false, onCancellationRequested: vi.fn() };
    const models = await provider.provideLanguageModelChatInformation({ silent: true }, mockCancellationToken as any);

    expect(models).toEqual([]);
  });
});

// ── Chat Response Provision ───────────────────────────────────────────────

describe('Chat Response Provision', () => {
  it('should handle chat response with text', async () => {
    const mockApiKey = 'test-api-key';
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(mockApiKey);

    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    await provider['initClient'](true);

    const mockModel = {
      id: 'test-model',
      name: 'Test Model',
      maxInputTokens: 1000,
      maxOutputTokens: 1000,
      defaultCompletionTokens: 1000,
      toolCalling: false,
      supportsParallelToolCalls: false,
      supportsVision: false,
    };

    const mockMessages = [
      {
        role: LanguageModelChatMessageRole.User,
        content: 'Hello',
      },
    ];

    const mockProgress = {
      report: vi.fn(),
    };

    const mockToken = {
      isCancellationRequested: false,
    };

    await provider.provideLanguageModelChatResponse(
      mockModel as any,
      mockMessages as any,
      {} as any,
      mockProgress as any,
      mockToken as any,
    );

    expect(mockProgress.report).toHaveBeenCalled();
  });
});

// ── Chat Response Edge Cases ───────────────────────────────────────────────

describe('Chat Response Edge Cases', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should handle cancellation during chat response', async () => {
    const mockApiKey = 'test-api-key';
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(mockApiKey);

    await provider['initClient'](true);

    const mockModel = {
      id: 'test-model',
      name: 'Test Model',
      maxInputTokens: 1000,
      maxOutputTokens: 1000,
      defaultCompletionTokens: 1000,
      toolCalling: false,
      supportsParallelToolCalls: false,
      supportsVision: false,
    };

    const mockMessages = [
      {
        role: LanguageModelChatMessageRole.User,
        content: 'Hello',
      },
    ];

    const mockProgress = {
      report: vi.fn(),
    };

    const mockToken = {
      isCancellationRequested: true,
    };

    await provider.provideLanguageModelChatResponse(
      mockModel as any,
      mockMessages as any,
      {} as any,
      mockProgress as any,
      mockToken as any,
    );

    expect(mockProgress.report).toHaveBeenCalled();
  });

  it('should handle error during chat response', async () => {
    const mockApiKey = 'test-api-key';
    vi.spyOn(mockContext.secrets, 'get').mockResolvedValue(mockApiKey);

    await provider['initClient'](true);

    const mockModel = {
      id: 'test-model',
      name: 'Test Model',
      maxInputTokens: 1000,
      maxOutputTokens: 1000,
      defaultCompletionTokens: 1000,
      toolCalling: false,
      supportsParallelToolCalls: false,
      supportsVision: false,
    };

    const mockMessages = [
      {
        role: LanguageModelChatMessageRole.User,
        content: 'Hello',
      },
    ];

    const mockProgress = {
      report: vi.fn(),
    };

    const mockToken = {
      isCancellationRequested: false,
    };

    // Mock the client to throw an error
    (provider as any).client = {
      chat: {
        stream: vi.fn().mockRejectedValue(new Error('Network error')),
      },
    };

    await provider.provideLanguageModelChatResponse(
      mockModel as any,
      mockMessages as any,
      {} as any,
      mockProgress as any,
      mockToken as any,
    );

    expect(mockProgress.report).toHaveBeenCalledWith(expect.objectContaining({ value: 'Error: Network error' }));
  });
});

// ── Tool Call Handling ────────────────────────────────────────────────────

describe('Tool Call Handling', () => {
  it('should generate a tool call ID', () => {
    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    const toolCallId = provider['generateToolCallId']();
    expect(toolCallId).toBeDefined();
    expect(toolCallId).toHaveLength(9);
    expect(toolCallId).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('should get Mistral tool call ID', () => {
    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    const vsCodeId = 'test-call-id';
    const mistralId = 'test-mistral-id';
    provider['toolCallIdMapping'].set(vsCodeId, mistralId);

    const result = provider['getMistralToolCallId'](vsCodeId);
    expect(result).toBe(mistralId);
  });

  it('should return undefined for unknown tool call ID', () => {
    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    const vsCodeId = 'unknown-call-id';

    const result = provider['getMistralToolCallId'](vsCodeId);
    expect(result).toBeUndefined();
  });
});

// ── Edge Cases ────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  it('should handle empty messages in toMistralMessages', () => {
    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    const messages: any[] = [];
    const mistralMessages = provider['toMistralMessages'](messages);
    expect(mistralMessages).toBeDefined();
    expect(mistralMessages.length).toBe(0);
  });

  it('should handle messages with no content', () => {
    const provider = new MistralChatModelProvider(mockContext, undefined, false);
    const messages = [
      {
        role: LanguageModelChatMessageRole.User,
        content: [],
      },
    ];
    const mistralMessages = provider['toMistralMessages'](messages as any);
    expect(mistralMessages).toBeDefined();
    expect(mistralMessages.length).toBe(0);
  });
});

// ── Token Count Provision ──────────────────────────────────────────────────

describe('Token Count Provision', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should count tokens for plain text', async () => {
    const text = 'Hello, world! This is a test.';
    const tokenCount = await provider.provideTokenCount({} as any, text, {} as any);
    expect(tokenCount).toBeGreaterThan(0);
  });

  it('should count tokens for a message with text parts', async () => {
    const message = {
      role: LanguageModelChatMessageRole.User,
      content: [new LanguageModelTextPart('Hello, world!')],
      name: undefined,
    };
    const tokenCount = await provider.provideTokenCount({} as any, message, {} as any);
    expect(tokenCount).toBeGreaterThan(0);
  });

  it('should count tokens for a message with tool calls', async () => {
    const message = {
      role: LanguageModelChatMessageRole.Assistant,
      content: [new LanguageModelToolCallPart('test-id', 'test-function', { key: 'value' })],
      name: undefined,
    };
    const tokenCount = await provider.provideTokenCount({} as any, message, {} as any);
    expect(tokenCount).toBeGreaterThan(0);
  });

  it('should count tokens for a message with tool results', async () => {
    const message = {
      role: LanguageModelChatMessageRole.User,
      content: [new LanguageModelToolResultPart('test-id', [new LanguageModelTextPart('result')])],
      name: undefined,
    };
    const tokenCount = await provider.provideTokenCount({} as any, message, {} as any);
    expect(tokenCount).toBeGreaterThan(0);
  });

  it('should return 0 for empty text', async () => {
    const text = '';
    const tokenCount = await provider.provideTokenCount({} as any, text, {} as any);
    expect(tokenCount).toBe(0);
  });

  it('should return 0 for a message with no content', async () => {
    const message = {
      role: LanguageModelChatMessageRole.User,
      content: [],
      name: undefined,
    };
    const tokenCount = await provider.provideTokenCount({} as any, message, {} as any);
    expect(tokenCount).toBe(0);
  });
});

// ── Clear Tool Call ID Mappings Edge Cases ────────────────────────────────

describe('Clear Tool Call ID Mappings Edge Cases', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should clear all tool call ID mappings', () => {
    const _vsCodeId1 = provider.getOrCreateVsCodeToolCallId('mistral-id-1');
    const vsCodeId2 = provider.getOrCreateVsCodeToolCallId('mistral-id-2');

    provider.clearToolCallIdMappings();

    expect(provider.getMistralToolCallId(_vsCodeId1)).toBeUndefined();
    expect(provider.getMistralToolCallId(vsCodeId2)).toBeUndefined();
  });

  it('should allow new mappings after clearing', () => {
    const vsCodeId1 = provider.getOrCreateVsCodeToolCallId('mistral-id-1');
    provider.clearToolCallIdMappings();

    const vsCodeId2 = provider.getOrCreateVsCodeToolCallId('mistral-id-1');
    expect(vsCodeId2).toMatch(/^[a-zA-Z0-9]{9}$/);
    expect(provider.getMistralToolCallId(vsCodeId2)).toBe('mistral-id-1');
  });

  it('should handle clearing when no mappings exist', () => {
    provider.clearToolCallIdMappings();

    const vsCodeId = provider.getOrCreateVsCodeToolCallId('mistral-id-1');
    expect(vsCodeId).toMatch(/^[a-zA-Z0-9]{9}$/);
    expect(provider.getMistralToolCallId(vsCodeId)).toBe('mistral-id-1');
  });
});

// ── Generate Tool Call ID Edge Cases ──────────────────────────────────────

describe('Generate Tool Call ID Edge Cases', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should generate unique tool call IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      const id = provider.generateToolCallId();
      expect(id).toMatch(/^[a-zA-Z0-9]{9}$/);
      ids.add(id);
    }
    expect(ids.size).toBe(100);
  });

  it('should generate tool call IDs with only alphanumeric characters', () => {
    for (let i = 0; i < 100; i++) {
      const id = provider.generateToolCallId();
      expect(id).toMatch(/^[a-zA-Z0-9]{9}$/);
    }
  });

  it('should generate tool call IDs of exactly 9 characters', () => {
    for (let i = 0; i < 100; i++) {
      const id = provider.generateToolCallId();
      expect(id).toHaveLength(9);
    }
  });
});

// ── Get or Create VS Code Tool Call ID Edge Cases ────────────────────────

describe('Get or Create VS Code Tool Call ID Edge Cases', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should return the same VS Code ID for the same Mistral ID', () => {
    const mistralId = 'mistral-id-1';
    const vsCodeId1 = provider.getOrCreateVsCodeToolCallId(mistralId);
    const vsCodeId2 = provider.getOrCreateVsCodeToolCallId(mistralId);

    expect(vsCodeId1).toBe(vsCodeId2);
  });

  it('should return different VS Code IDs for different Mistral IDs', () => {
    const _vsCodeId1 = provider.getOrCreateVsCodeToolCallId('mistral-id-1');
    const vsCodeId2 = provider.getOrCreateVsCodeToolCallId('mistral-id-2');

    expect(_vsCodeId1).not.toBe(vsCodeId2);
  });

  it('should register bidirectional mapping', () => {
    const mistralId = 'mistral-id-1';
    const vsCodeId = provider.getOrCreateVsCodeToolCallId(mistralId);

    expect(provider.getMistralToolCallId(vsCodeId)).toBe(mistralId);
  });

  it('should handle empty Mistral ID', () => {
    const vsCodeId = provider.getOrCreateVsCodeToolCallId('');
    expect(vsCodeId).toMatch(/^[a-zA-Z0-9]{9}$/);
  });

  it('should handle Mistral ID with special characters', () => {
    const mistralId = 'mistral-id-!@#$%^&*()';
    const vsCodeId = provider.getOrCreateVsCodeToolCallId(mistralId);
    expect(vsCodeId).toMatch(/^[a-zA-Z0-9]{9}$/);
  });
});

// ── Get Mistral Tool Call ID Edge Cases ──────────────────────────────────

describe('Get Mistral Tool Call ID Edge Cases', () => {
  let provider: MistralChatModelProvider;

  beforeEach(() => {
    provider = new MistralChatModelProvider(mockContext, undefined, false);
  });

  it('should return the Mistral ID for a known VS Code ID', () => {
    const mistralId = 'mistral-id-1';
    const vsCodeId = provider.getOrCreateVsCodeToolCallId(mistralId);

    const result = provider.getMistralToolCallId(vsCodeId);
    expect(result).toBe(mistralId);
  });

  it('should return undefined for an unknown VS Code ID', () => {
    const result = provider.getMistralToolCallId('unknown-id');
    expect(result).toBeUndefined();
  });

  it('should handle empty VS Code ID', () => {
    const result = provider.getMistralToolCallId('');
    expect(result).toBeUndefined();
  });

  it('should handle VS Code ID with special characters', () => {
    const result = provider.getMistralToolCallId('vs-code-id-!@#$%^&*()');
    expect(result).toBeUndefined();
  });
});

// ── EventEmitter (vscode mock) ────────────────────────────────────────────────

describe('EventEmitter', () => {
  it('fires events to subscribed listeners', async () => {
    const { EventEmitter } = await import('./test/vscode.mock.js');
    const emitter = new EventEmitter<string>();
    const received: string[] = [];
    emitter.event(v => received.push(v));
    emitter.fire('hello');
    expect(received).toEqual(['hello']);
  });

  it('removes a listener when its subscription is disposed', async () => {
    const { EventEmitter } = await import('./test/vscode.mock.js');
    const emitter = new EventEmitter<number>();
    const received: number[] = [];
    const sub = emitter.event(v => received.push(v));
    emitter.fire(1);
    sub.dispose();
    emitter.fire(2);
    expect(received).toEqual([1]);
  });

  it('swallows errors thrown by listeners so other listeners still run', async () => {
    const { EventEmitter } = await import('./test/vscode.mock.js');
    const emitter = new EventEmitter<void>();
    const spy = vi.fn();
    emitter.event(() => {
      throw new Error('boom');
    });
    emitter.event(spy);
    expect(() => emitter.fire()).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });

  it('clears all listeners on dispose', async () => {
    const { EventEmitter } = await import('./test/vscode.mock.js');
    const emitter = new EventEmitter<void>();
    const spy = vi.fn();
    emitter.event(spy);
    emitter.dispose();
    emitter.fire();
    expect(spy).not.toHaveBeenCalled();
  });
});
