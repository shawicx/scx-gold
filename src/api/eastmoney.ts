interface JsonpOptions {
  timeout?: number;
  callbackParam?: string;
}

export function jsonpRequest<T>(
  url: string,
  options: JsonpOptions = {},
): Promise<T> {
  const { timeout = 10000, callbackParam = 'cb' } = options;
  return new Promise<T>((resolve, reject) => {
    const cbName = `__jsonp_cb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const script = document.createElement('script');
    let finished = false;

    const timeoutId = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error(`JSONP timeout after ${timeout}ms`));
    }, timeout);

    function cleanup() {
      window.clearTimeout(timeoutId);
      delete (window as any)[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    (window as any)[cbName] = (data: T) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error('JSONP network error'));
    };

    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}${callbackParam}=${cbName}`;
    document.body.appendChild(script);
  });
}
