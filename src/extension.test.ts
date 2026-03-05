import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chat,
  ChatRequestTurn,
  ChatResponseMarkdownPart,
  ChatResponseTurn,
  commands,
  LanguageModelTextPart,
  lm,
  MarkdownString,
} from 'vscode';
import { activate, deactivate } from './extension.js';

vi.mock('./provider', () => ({
  MistralChatModelProvider: vi.fn().mockImplementation(function () {
    return { setApiKey: vi.fn() };
  }),
}));

describe('extension', () => {
  const mockContext = {
    subscriptions: { push: vi.fn() },
    extensionUri: '/fake-extension',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('activate', () => {
    it('registers the language model chat provider', () => {
      activate(mockContext);
      expect(lm.registerLanguageModelChatProvider).toHaveBeenCalledWith('mistral', expect.any(Object));
    });

    it('registers the manageApiKey command', () => {
      activate(mockContext);
      expect(commands.registerCommand).toHaveBeenCalledWith('mistral-chat.manageApiKey', expect.any(Function));
    });

    it('pushes exactly 2 disposables into context.subscriptions (provider + command)', () => {
      activate(mockContext);
      // First push call is provider + command bundled together
      expect(mockContext.subscriptions.push.mock.calls[0]).toHaveLength(2);
    });

    it('creates the @mistral chat participant', () => {
      activate(mockContext);
      expect(chat.createChatParticipant).toHaveBeenCalledWith('mistral-models-vscode.mistral', expect.any(Function));
    });

    it('pushes participant disposable into context.subscriptions', () => {
      activate(mockContext);
      // Second push call is the participant
      expect(mockContext.subscriptions.push).toHaveBeenCalledTimes(2);
      expect(mockContext.subscriptions.push.mock.calls[1]).toHaveLength(1);
    });
  });

  describe('activate — participant handler', () => {
    async function getHandler() {
      activate(mockContext);
      const [, handler] = (chat.createChatParticipant as ReturnType<typeof vi.fn>).mock.calls[0];
      return handler;
    }

    it('sends history + prompt to request.model.sendRequest', async () => {
      const handler = await getHandler();

      const mockStream = { markdown: vi.fn() };
      const mockResponse = {
        stream: (async function* () {
          yield new LanguageModelTextPart('world');
        })(),
      };
      const mockSendRequest = vi.fn().mockResolvedValue(mockResponse);

      const mockRequest = { prompt: 'hello', model: { sendRequest: mockSendRequest } };
      const mockChatContext = { history: [] };
      const mockToken = { isCancellationRequested: false };

      await handler(mockRequest, mockChatContext, mockStream, mockToken);

      expect(mockSendRequest).toHaveBeenCalledOnce();
      const [messages] = mockSendRequest.mock.calls[0];
      // Last message is the current prompt
      expect(messages.at(-1).content).toBe('hello');
    });

    it('streams text chunks back as markdown', async () => {
      const handler = await getHandler();

      const mockStream = { markdown: vi.fn() };
      const mockResponse = {
        stream: (async function* () {
          yield new LanguageModelTextPart('chunk1');
          yield new LanguageModelTextPart('chunk2');
        })(),
      };
      const mockSendRequest = vi.fn().mockResolvedValue(mockResponse);

      await handler({ prompt: 'test', model: { sendRequest: mockSendRequest } }, { history: [] }, mockStream, {
        isCancellationRequested: false,
      });

      expect(mockStream.markdown).toHaveBeenCalledWith('chunk1');
      expect(mockStream.markdown).toHaveBeenCalledWith('chunk2');
    });

    it('includes prior ChatRequestTurn as a User message in history', async () => {
      const handler = await getHandler();

      const mockResponse = { stream: (async function* () {})() };
      const mockSendRequest = vi.fn().mockResolvedValue(mockResponse);

      const priorRequest = new (ChatRequestTurn as any)('prior question');
      await handler(
        { prompt: 'follow-up', model: { sendRequest: mockSendRequest } },
        { history: [priorRequest] },
        { markdown: vi.fn() },
        { isCancellationRequested: false },
      );

      const [messages] = mockSendRequest.mock.calls[0];
      expect(messages[0].content).toBe('prior question');
      expect(messages[1].content).toBe('follow-up');
    });

    it('includes prior ChatResponseTurn as an Assistant message in history', async () => {
      const handler = await getHandler();

      const mockResponse = { stream: (async function* () {})() };
      const mockSendRequest = vi.fn().mockResolvedValue(mockResponse);

      const priorResponse = new (ChatResponseTurn as any)([
        new (ChatResponseMarkdownPart as any)(new (MarkdownString as any)('prior answer')),
      ]);
      await handler(
        { prompt: 'next', model: { sendRequest: mockSendRequest } },
        { history: [priorResponse] },
        { markdown: vi.fn() },
        { isCancellationRequested: false },
      );

      const [messages] = mockSendRequest.mock.calls[0];
      expect(messages[0].content).toBe('prior answer');
    });

    it('surfaces errors as a markdown message', async () => {
      const handler = await getHandler();

      const mockStream = { markdown: vi.fn() };
      const mockSendRequest = vi.fn().mockRejectedValue(new Error('model unavailable'));

      await handler({ prompt: 'hi', model: { sendRequest: mockSendRequest } }, { history: [] }, mockStream, {
        isCancellationRequested: false,
      });

      expect(mockStream.markdown).toHaveBeenCalledWith(expect.stringContaining('model unavailable'));
    });
  });

  describe('deactivate', () => {
    it('returns undefined', () => {
      expect(deactivate()).toBeUndefined();
    });
  });
});
