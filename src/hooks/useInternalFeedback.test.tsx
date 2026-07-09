import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const h = vi.hoisted(() => ({
  orderLog: [] as string[],
  getUser: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn(),
  invoke: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  createSignedUrls: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: (...a: unknown[]) => h.getUser(...a) },
    from: (...a: unknown[]) => h.from(...a),
    storage: { from: (...a: unknown[]) => h.storageFrom(...a) },
    functions: { invoke: (...a: unknown[]) => h.invoke(...a) },
  },
}));

import {
  useCreateInternalFeedback,
  useDeleteInternalFeedback,
} from './useInternalFeedback';

// A thenable query-builder: every method returns the builder (so chains work),
// awaiting it resolves to `result`. Each method call is logged for ordering.
function qb(result: unknown, tag: string) {
  const b: Record<string, unknown> = {};
  const rec = (name: string) => () => {
    h.orderLog.push(`${tag}.${name}`);
    return b;
  };
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single']) {
    b[m] = vi.fn(rec(m));
  }
  b.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return b;
}

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  h.orderLog.length = 0;
  h.getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } } });
  h.from.mockReset();
  h.invoke.mockReset().mockResolvedValue({ data: null, error: null });
  h.upload.mockReset();
  h.remove.mockReset().mockResolvedValue({ error: null });
  h.createSignedUrls.mockReset();
  h.storageFrom
    .mockReset()
    .mockReturnValue({
      upload: (...a: unknown[]) => h.upload(...a),
      remove: (...a: unknown[]) => h.remove(...a),
      createSignedUrls: (...a: unknown[]) => h.createSignedUrls(...a),
    });
});

function file(name: string, type = 'image/png') {
  return new File(['x'], name, { type });
}

describe('useCreateInternalFeedback', () => {
  it('inserts the row, uploads screenshots, links them, then notifies', async () => {
    h.from.mockImplementation((table: string) =>
      table === 'internal_feedback'
        ? qb({ data: { id: 'fb1' }, error: null }, 'fb')
        : qb({ error: null }, 'att'),
    );
    h.upload.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useCreateInternalFeedback(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({
      type: 'bug',
      message: 'broken',
      files: [file('a.png')],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(h.upload).toHaveBeenCalledTimes(1);
    expect(h.invoke).toHaveBeenCalledWith('notify-feedback', {
      body: { feedback_id: 'fb1' },
    });
  });

  it('still succeeds when the notify email fails (best-effort)', async () => {
    h.from.mockImplementation((table: string) =>
      table === 'internal_feedback'
        ? qb({ data: { id: 'fb1' }, error: null }, 'fb')
        : qb({ error: null }, 'att'),
    );
    h.upload.mockResolvedValue({ error: null });
    h.invoke.mockRejectedValue(new Error('resend down'));

    const { result } = renderHook(() => useCreateInternalFeedback(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ type: 'bug', message: 'x', files: [] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls back (removes uploaded objects + deletes the row) when an upload fails', async () => {
    h.from.mockImplementation((table: string) =>
      table === 'internal_feedback'
        ? qb({ data: { id: 'fb1' }, error: null }, 'fb')
        : qb({ error: null }, 'att'),
    );
    // first upload succeeds, second fails
    h.upload
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'boom' } });

    const { result } = renderHook(() => useCreateInternalFeedback(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      type: 'bug',
      message: 'broken',
      files: [file('a.png'), file('b.png')],
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // one object was uploaded before the failure → it must be removed
    expect(h.remove).toHaveBeenCalledTimes(1);
    expect(h.remove.mock.calls[0][0]).toHaveLength(1);
    // the orphan feedback row must be deleted
    expect(h.orderLog).toContain('fb.delete');
    // no notification on a failed submission
    expect(h.invoke).not.toHaveBeenCalled();
  });
});

describe('useDeleteInternalFeedback', () => {
  it('fetches attachment paths BEFORE deleting the row, then removes the objects', async () => {
    h.from.mockImplementation((table: string) =>
      table === 'internal_feedback_attachments'
        ? qb({ data: [{ storage_path: 'fb1/a.png' }], error: null }, 'att')
        : qb({ error: null }, 'fb'),
    );

    const { result } = renderHook(() => useDeleteInternalFeedback(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate('fb1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const fetchIdx = h.orderLog.indexOf('att.select');
    const deleteIdx = h.orderLog.indexOf('fb.delete');
    expect(fetchIdx).toBeGreaterThanOrEqual(0);
    expect(deleteIdx).toBeGreaterThan(fetchIdx);
    expect(h.remove).toHaveBeenCalledWith(['fb1/a.png']);
  });
});
