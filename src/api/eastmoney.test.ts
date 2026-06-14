import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jsonpRequest } from './eastmoney';

describe('jsonpRequest', () => {
  let scripts: HTMLScriptElement[];

  beforeEach(() => {
    scripts = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'script') {
        scripts.push(el as HTMLScriptElement);
        setTimeout(() => {
          // simulate the browser firing onload by invoking window[callback]
          const src = (el as any)._src || (el as any).src;
          if (src) {
            (el as any).src = src; // trigger the setter if not yet set
          }
        }, 0);
      }
      return el;
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      // Trigger the JSONP callback asynchronously when the script is appended
      const script = node as HTMLScriptElement;
      setTimeout(() => {
        const src = (script as any).src || (script as any)._src;
        if (!src) return;
        // Don't auto-invoke — tests do this explicitly via the jsonpRequest promise
      }, 0);
      return node;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves with data when callback fires', async () => {
    const promise = jsonpRequest<{ hello: string }>('https://example.com/api');
    await new Promise((r) => setTimeout(r, 0));

    // The implementation appends a script; we simulate the JSONP callback firing
    const cbName = Object.keys(window).find((k) => k.startsWith('__jsonp_cb_'));
    expect(cbName).toBeDefined();
    (window as any)[cbName!]({ hello: 'world' });

    await expect(promise).resolves.toEqual({ hello: 'world' });
  });

  it('rejects on timeout', async () => {
    vi.useFakeTimers();
    try {
      const promise = jsonpRequest('https://example.com/api', { timeout: 100 });
      vi.advanceTimersByTime(200);
      await expect(promise).rejects.toThrow('JSONP timeout');
    } finally {
      vi.useRealTimers();
    }
  });
});
