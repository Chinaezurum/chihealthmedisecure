import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runChat, getTriageSuggestion } from './geminiService';

const buildResponse = (text: string, init?: { ok?: boolean; status?: number; contentType?: string }) => ({
  ok: init?.ok ?? true,
  status: init?.status ?? 200,
  headers: {
    get: vi.fn().mockImplementation((key: string) => (key.toLowerCase() === 'content-type' ? init?.contentType ?? 'application/json' : null)),
  },
  text: vi.fn().mockResolvedValue(text),
});

describe('geminiService', () => {
  const fetchSpy = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchSpy.mockReset();
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('runChat', () => {
    it('posts the prompt to the AI proxy and returns the response text', async () => {
      const expectedText = 'Hello from AI';
      fetchSpy.mockResolvedValue(buildResponse(JSON.stringify({ text: expectedText })));

      const prompt = 'How are you?';
      const result = await runChat(prompt);

      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/ai/generate'), expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
      expect(body).toMatchObject({ model: 'gemini-2.5-flash', contents: prompt });
      expect(result).toBe(expectedText);
    });

    it('throws when the proxy responds with an error', async () => {
      fetchSpy.mockResolvedValue(buildResponse('boom', { ok: false, status: 500 }));

      await expect(runChat('test')).rejects.toThrow('boom');
    });
  });

  describe('getTriageSuggestion', () => {
    it('returns parsed JSON when the proxy responds with structured data', async () => {
      const payload = JSON.stringify({ recommendation: 'appointment' });
      fetchSpy.mockResolvedValue(buildResponse(payload));

      const result = await getTriageSuggestion('symptom details');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ recommendation: 'appointment' });
    });

    it('returns empty string when proxy responds with no body', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        text: vi.fn().mockResolvedValue(''),
      });

      const result = await getTriageSuggestion('symptom');
      expect(result).toBe('');
    });
  });
});
