// Supabase has been removed. The browser never talks to a database directly:
// chat, likes, comments, etc. go through the app's own API routes (Cloudflare D1).
//
// This stub keeps the old call sites compiling and harmless:
// - channel()/removeChannel(): realtime is replaced by polling, so they do nothing
// - from(): returns an empty error result if anything still calls it

type StubResult = { data: null; error: { message: string }; count: null };

const RESULT: StubResult = { data: null, error: { message: 'Supabase has been removed; use the app API instead.' }, count: null };

function stubQuery(): any {
  const target = () => undefined;
  const handler: ProxyHandler<any> = {
    get(_t, prop) {
      if (prop === 'then') return (ok: (r: StubResult) => unknown) => Promise.resolve(RESULT).then(ok);
      return () => proxy;
    },
    apply() {
      return proxy;
    },
  };
  const proxy: any = new Proxy(target, handler);
  return proxy;
}

function noopChannel(): any {
  const ch: any = {
    on: () => ch,
    subscribe: (cb?: (status: string) => void) => {
      try {
        cb?.('CLOSED');
      } catch {}
      return ch;
    },
    send: async () => 'ok',
    track: async () => 'ok',
    unsubscribe: async () => 'ok',
  };
  return ch;
}

const client = {
  from: (_table?: string) => stubQuery(),
  channel: (_name?: string, _opts?: unknown) => noopChannel(),
  removeChannel: (_channel?: unknown) => undefined,
  removeAllChannels: () => undefined,
  rpc: async () => RESULT,
};

export function createClient() {
  return client;
}
