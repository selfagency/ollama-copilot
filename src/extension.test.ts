import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

// Mock VS Code modules
vi.mock('vscode');

describe('activate', () => {
  it('should be importable', async () => {
    // Just test that the extension can be imported without errors
    const ext = await import('./extension.js');
    expect(ext).toBeDefined();
  });
});
