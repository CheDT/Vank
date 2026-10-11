import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api.js';

afterEach(() => { vi.unstubAllGlobals(); });

describe('API client', () => {
  it('loads state through the same-origin API', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ transactions: [] }) }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(api.loadState()).resolves.toEqual({ transactions: [] });
    expect(fetchMock).toHaveBeenCalledWith('/api/state', expect.objectContaining({ method: 'GET', signal: expect.any(AbortSignal) }));
  });

  it('sends JSON snapshots and surfaces unsuccessful HTTP responses', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 500 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(api.saveState({ transactions: [] })).rejects.toThrow('API POST /state failed: 500');
    expect(fetchMock).toHaveBeenCalledWith('/api/state', expect.objectContaining({
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"transactions":[]}'
    }));
  });

  it('escapes budget categories in URL paths', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    vi.stubGlobal('fetch', fetchMock);
    await api.deleteBudget('Meals / Travel');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/budgets/Meals%20%2F%20Travel');
  });
});

