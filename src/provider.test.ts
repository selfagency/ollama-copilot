import { describe, expect, it } from 'vitest';
import { formatModelName } from './provider.js';

// ── formatModelName ───────────────────────────────────────────────────────────

describe('formatModelName', () => {
  it('capitalizes a single segment', () => {
    expect(formatModelName('llama2')).toBe('Llama2');
  });

  it('capitalizes each hyphen-separated segment', () => {
    expect(formatModelName('neural-chat-7b')).toBe('Neural Chat 7b');
  });

  it('handles numeric segments without error', () => {
    expect(formatModelName('mistral-7b-v0.1')).toBe('Mistral 7b V0.1');
  });

  it('removes ollama/ prefix if present', () => {
    expect(formatModelName('ollama/llama2')).toBe('Llama2');
  });
});
