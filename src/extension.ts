import * as vscode from 'vscode';
import { getOllamaClient } from './client.js';
import { OllamaChatModelProvider } from './provider.js';

export async function activate(context: vscode.ExtensionContext) {
  const logOutputChannel =
    typeof vscode.window.createOutputChannel === 'function'
      ? vscode.window.createOutputChannel('Ollama Models', { log: true })
      : undefined;

  const client = await getOllamaClient(context);
  const provider = new OllamaChatModelProvider(context, client, logOutputChannel!);
  context.subscriptions.push(
    vscode.lm.registerLanguageModelChatProvider('ollama', provider),
    vscode.commands.registerCommand('ollama-copilot.manageAuthToken', async () => {
      await provider.setAuthToken();
    }),
  );

  if (logOutputChannel) {
    context.subscriptions.push(logOutputChannel);
  }

  const participantHandler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    chatContext: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<void> => {
    const messages: vscode.LanguageModelChatMessage[] = [];

    for (const turn of chatContext.history) {
      if (turn instanceof vscode.ChatRequestTurn) {
        messages.push(vscode.LanguageModelChatMessage.User(turn.prompt));
      } else if (turn instanceof vscode.ChatResponseTurn) {
        const text = turn.response
          .filter((r): r is vscode.ChatResponseMarkdownPart => r instanceof vscode.ChatResponseMarkdownPart)
          .map(r => r.value.value)
          .join('');
        if (text) {
          messages.push(vscode.LanguageModelChatMessage.Assistant(text));
        }
      }
    }

    messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

    try {
      const response = await request.model.sendRequest(messages, {}, token);
      for await (const chunk of response.stream) {
        if (chunk instanceof vscode.LanguageModelTextPart) {
          stream.markdown(chunk.value);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      stream.markdown(`Error: ${message}`);
    }
  };

  const participant = vscode.chat.createChatParticipant('ollama-copilot.ollama', participantHandler);
  participant.iconPath = (vscode.Uri as any).joinPath(context.extensionUri, 'logo.png');
  context.subscriptions.push(participant);
}

export function deactivate() {}
