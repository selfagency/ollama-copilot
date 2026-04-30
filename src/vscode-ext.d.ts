// Augment the vscode module to add joinPath, which is missing from the
// vscode@1.1.37 type stubs used in the test environment.
declare module 'vscode' {
  namespace Uri {
    function joinPath(base: Uri, ...pathSegments: string[]): Uri;
  }

  // LanguageModelTextPart constructor is not declared in older type stubs.
  interface LanguageModelTextPart {
    readonly value: string;
  }
  const LanguageModelTextPart: {
    new (value: string): LanguageModelTextPart;
  };

  // registerTool overload used in lmTools.ts (3-argument form).
  type LmToolHandler<I = Record<string, unknown>> = (
    input: I,
    token: CancellationToken,
  ) => Promise<{ content: LanguageModelTextPart[] }>;

  interface LmToolDefinition {
    description: string;
    inputSchema: Record<string, unknown>;
  }

  namespace lm {
    function registerTool(
      name: string,
      definition: LmToolDefinition,
      handler: LmToolHandler,
    ): Disposable;
  }
}
