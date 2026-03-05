import { Ollama } from 'ollama';
import {
  commands,
  Disposable,
  Event,
  EventEmitter,
  ExtensionContext,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  window,
  workspace,
} from 'vscode';

/**
 * Tree item representing a pane or model in the sidebar
 */
export class ModelTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: 'pane' | 'model' | 'running',
    public readonly size?: number,
  ) {
    super(label);
    this.contextValue = type;
    this.collapsibleState = type === 'pane' ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.None;

    if (type === 'model' || type === 'running') {
      this.description = this.formatSize(size);
    }
  }

  private formatSize(bytes?: number): string {
    if (!bytes) return '';
    const gb = bytes / 1024 ** 3;
    return gb.toFixed(1) + ' GB';
  }
}

/**
 * Ollama sidebar/activity bar view provider
 */
export class OllamaSidebarProvider implements TreeDataProvider<ModelTreeItem>, Disposable {
  private treeChangeEmitter = new EventEmitter<ModelTreeItem | null>();
  readonly onDidChangeTreeData: Event<ModelTreeItem | null> = this.treeChangeEmitter.event;

  private panes: ModelTreeItem[] = [
    new ModelTreeItem('Library', 'pane'),
    new ModelTreeItem('Installed', 'pane'),
    new ModelTreeItem('Processes', 'pane'),
  ];

  private refreshTimeout: NodeJS.Timeout | null = null;
  private lastRefreshTime = 0;
  private libraryLastRefreshTime = 0;
  private refreshIntervals: NodeJS.Timeout[] = [];

  constructor(private client: Ollama) {
    this.startAutoRefresh();
  }

  /**
   * Get tree items for a given element
   */
  async getChildren(element?: ModelTreeItem): Promise<ModelTreeItem[]> {
    // Root level: return panes
    if (!element) {
      return this.panes;
    }

    // Pane level: return models
    if (element.type === 'pane') {
      switch (element.label) {
        case 'Installed':
          return this.getInstalledModels();
        case 'Processes':
          return this.getRunningModels();
        case 'Library':
          return this.getLibraryModels();
        default:
          return [];
      }
    }

    return [];
  }

  /**
   * Get tree item metadata
   */
  getTreeItem(element: ModelTreeItem): TreeItem {
    return element;
  }

  /**
   * Get installed models from Ollama
   */
  private async getInstalledModels(): Promise<ModelTreeItem[]> {
    try {
      const response = await this.client.list();
      return response.models.map(model => new ModelTreeItem(model.name, 'model', model.size));
    } catch {
      return [new ModelTreeItem('Failed to load models', 'model')];
    }
  }

  /**
   * Get running processes from Ollama
   */
  private async getRunningModels(): Promise<ModelTreeItem[]> {
    try {
      const response = await this.client.ps();
      return response.models.map(model => new ModelTreeItem(model.name, 'running', model.size));
    } catch {
      return [new ModelTreeItem('Failed to load running models', 'model')];
    }
  }

  /**
   * Get models available from library (placeholder for catalog fetching)
   */
  private async getLibraryModels(): Promise<ModelTreeItem[]> {
    return [new ModelTreeItem('Loading library...', 'model')];
  }

  /**
   * Refresh the tree (manual refresh button - forces immediate refresh)
   */
  refresh(): void {
    this.lastRefreshTime = 0; // Force refresh
    this.treeChangeEmitter.fire(null);
  }

  /**
   * Debounced refresh that coalesces rapid refresh calls
   */
  private debouncedRefresh(): void {
    const debounceMs = workspace.getConfiguration('ollama').get<number>('debounceInterval') || 300;
    const now = Date.now();

    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    // Only refresh if debounce interval has passed
    if (now - this.lastRefreshTime >= debounceMs) {
      this.lastRefreshTime = now;
      this.treeChangeEmitter.fire(null);
    } else {
      // Schedule refresh for later
      this.refreshTimeout = setTimeout(
        () => {
          this.lastRefreshTime = Date.now();
          this.treeChangeEmitter.fire(null);
          this.refreshTimeout = null;
        },
        debounceMs - (now - this.lastRefreshTime),
      );
    }
  }

  /**
   * Start auto-refresh timers for local models and library
   */
  private startAutoRefresh(): void {
    const localRefreshSecs = workspace.getConfiguration('ollama').get<number>('localModelRefreshInterval') || 30;

    // Auto-refresh local/running models every 30 seconds
    if (localRefreshSecs > 0) {
      const localInterval = setInterval(() => {
        this.debouncedRefresh();
      }, localRefreshSecs * 1000);
      this.refreshIntervals.push(localInterval);
    }

    // Auto-refresh library every 6 hours
    const libraryRefreshSecs = workspace.getConfiguration('ollama').get<number>('libraryRefreshInterval') || 21600;
    if (libraryRefreshSecs > 0) {
      const libraryInterval = setInterval(() => {
        const now = Date.now();
        if (now - this.libraryLastRefreshTime >= libraryRefreshSecs * 1000) {
          this.libraryLastRefreshTime = now;
          this.debouncedRefresh();
        }
      }, libraryRefreshSecs * 1000);
      this.refreshIntervals.push(libraryInterval);
    }

    // Watch for settings changes and restart intervals
    workspace.onDidChangeConfiguration(e => {
      if (
        e.affectsConfiguration('ollama.localModelRefreshInterval') ||
        e.affectsConfiguration('ollama.libraryRefreshInterval')
      ) {
        this.stopAutoRefresh();
        this.startAutoRefresh();
      }
    });
  }

  /**
   * Stop all auto-refresh timers
   */
  private stopAutoRefresh(): void {
    for (const interval of this.refreshIntervals) {
      clearInterval(interval);
    }
    this.refreshIntervals = [];
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stopAutoRefresh();
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<void> {
    try {
      await this.client.delete({ model: modelName });
      this.refresh();
      window.showInformationMessage(`Model ${modelName} deleted`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      window.showErrorMessage(`Failed to delete model: ${msg}`);
    }
  }

  /**
   * Pull (download) a model
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      window.withProgress(
        { location: 15, title: `Pulling ${modelName}...` }, // 15 = ProgressLocation.Window
        async () => {
          await this.client.pull({ model: modelName });
          this.refresh();
          window.showInformationMessage(`Model ${modelName} pulled successfully`);
        },
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      window.showErrorMessage(`Failed to pull model: ${msg}`);
    }
  }

  /**
   * Stop a running model
   */
  async stopModel(modelName: string): Promise<void> {
    try {
      // Ollama doesn't have a direct "stop" API, but models stop when no longer used
      // This is a placeholder for future implementation
      window.showInformationMessage(`Model stop not yet implemented for ${modelName}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      window.showErrorMessage(`Failed to stop model: ${msg}`);
    }
  }
}

/**
 * Register sidebar with VS Code
 */
export function registerSidebar(context: ExtensionContext, client: Ollama): void {
  const provider = new OllamaSidebarProvider(client);

  context.subscriptions.push(
    window.registerTreeDataProvider('ollama-sidebar', provider),
    commands.registerCommand('ollama-copilot.refreshSidebar', () => {
      provider.refresh();
      window.showInformationMessage('Models refreshed');
    }),
    commands.registerCommand('ollama-copilot.refreshLibrary', () => {
      provider.refresh();
      window.showInformationMessage('Library catalog refreshed');
    }),
    commands.registerCommand('ollama-copilot.deleteModel', (item: ModelTreeItem) => {
      if (item.type === 'model' || item.type === 'running') {
        void provider.deleteModel(item.label);
      }
    }),
    commands.registerCommand('ollama-copilot.pullModel', async () => {
      const modelName = await window.showInputBox({
        prompt: 'Enter model name or identifier (e.g., llama2, mistral:7b)',
        ignoreFocusOut: false,
      });
      if (modelName) {
        void provider.pullModel(modelName);
      }
    }),
    commands.registerCommand('ollama-copilot.stopModel', (item: ModelTreeItem) => {
      if (item.type === 'running') {
        void provider.stopModel(item.label);
      }
    }),
    {
      dispose: () => provider.dispose(),
    },
  );
}
