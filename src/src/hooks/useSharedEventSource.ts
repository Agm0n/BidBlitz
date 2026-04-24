import { useEffect, useRef } from 'react';

type Handlers = {
  onOpen?: (ev: Event) => void;
  onError?: (ev: any) => void;
  onMessage?: (ev: MessageEvent) => void;
  events?: Record<string, (ev: MessageEvent) => void>;
};

type SharedEntry = {
  es: EventSource | null;
  refCount: number;
  backoff: number; // The delay before trying to reconnect
  reconnectTimer?: number | null;
  isOpening?: boolean;
  namedListeners: Map<string, Set<(ev: MessageEvent) => void>>;
  genericListeners: Set<(ev: MessageEvent) => void>;
  openHandlers: Set<(ev: Event) => void>;
  errorHandlers: Set<(ev: any) => void>;
};

const sharedMap = new Map<string, SharedEntry>();

function createEntry(url: string): SharedEntry {
  const entry: SharedEntry = {
    es: null,
    refCount: 0,
    backoff: 1000,
    reconnectTimer: null,
    isOpening: false,
    namedListeners: new Map(),
    genericListeners: new Set(),
    openHandlers: new Set(),
    errorHandlers: new Set(),
  };
  sharedMap.set(url, entry);
  openUrl(url, entry);
  return entry;
}

function openUrl(url: string, entry: SharedEntry) {
  if (entry.es) return;
  if (entry.isOpening) return; // guard concurrent open attempts so it wont open multiple connections
  entry.isOpening = true;
  try {
    const es = new EventSource(url);
    entry.es = es;

    es.onopen = (ev) => {
      entry.backoff = 1000;
      entry.openHandlers.forEach(h => { try { h(ev); } catch (e) {} });
      entry.isOpening = false;
      if (entry.reconnectTimer) { window.clearTimeout(entry.reconnectTimer); entry.reconnectTimer = null; }
    };

    es.onerror = (ev) => {
      entry.errorHandlers.forEach(h => { try { h(ev); } catch (e) {} });
      try { es.close(); } catch (e) {}
      entry.es = null;
      entry.isOpening = false;
      // schedule reconnect with backoff
      const wait = Math.min(entry.backoff, 30_000);
      entry.backoff = Math.min(30_000, Math.floor(entry.backoff * 1.5));
      if (entry.reconnectTimer) return; // already scheduled
      entry.reconnectTimer = window.setTimeout(() => {
        entry.reconnectTimer = null;
        openUrl(url, entry);
      }, wait);
    };

    es.onmessage = (ev) => {
      // generic listeners
      entry.genericListeners.forEach(h => { try { h(ev); } catch (e) {} });
    };

    // attach named listeners (for example 'new_bid'...)
    entry.namedListeners.forEach((set, name) => {
      set.forEach(fn => es.addEventListener(name, fn as EventListenerOrEventListenerObject));
    });
  } catch (e) {
    entry.errorHandlers.forEach(h => { try { h(e); } catch (err) {} });
    entry.isOpening = false;
    // schedule reconnect if not already scheduled
    const wait = Math.min(entry.backoff, 30_000);
    entry.backoff = Math.min(30_000, Math.floor(entry.backoff * 1.5));
    if (entry.reconnectTimer) return;
    entry.reconnectTimer = window.setTimeout(() => {
      entry.reconnectTimer = null;
      openUrl(url, entry);
    }, wait);
  }
}

function closeEntryIfUnused(url: string) {
  const entry = sharedMap.get(url);
  if (!entry) return;
  if (entry.refCount <= 0) {
    if (entry.es) {
      try { entry.es.close(); } catch (e) {}
      entry.es = null;
    }
    if (entry.reconnectTimer) {
      window.clearTimeout(entry.reconnectTimer);
      entry.reconnectTimer = null;
    }
    sharedMap.delete(url);
  }
}

/**
 * useSharedEventSource(url, handlers, enabled?)
 * - Multiple components can call this hook with the same URL and they will share a single EventSource.
 * - The hook subscribes the provided handlers and unsubscribes on unmount. The underlying EventSource is reference-counted and will be cleaned up when no components use it.
 */
export default function useSharedEventSource(url: string | null, handlers: Handlers, enabled = true) {
  const urlRef = useRef(url);

  // NOTE: handlers may be recreated by callers on every render. To avoid repeated registration/unregistration (which can create many reconnect attempts),
  // the effect depends only on `url` and `enabled`.
  // Callers should memoize `handlers` (useMemo) or use stable callbacks (useCallback) when they expect handler updates.
  useEffect(() => {
    if (!enabled || !url) return;
    urlRef.current = url;

    let entry = sharedMap.get(url);
    if (!entry) entry = createEntry(url);
    entry.refCount += 1;

    // register handlers (capture the handlers object as-is on mount)
    if (handlers.onOpen) entry.openHandlers.add(handlers.onOpen);
    if (handlers.onError) entry.errorHandlers.add(handlers.onError);
    if (handlers.onMessage) entry.genericListeners.add(handlers.onMessage);
    if (handlers.events) {
      Object.entries(handlers.events).forEach(([name, fn]) => {
        let set = entry!.namedListeners.get(name);
        if (!set) { set = new Set(); entry!.namedListeners.set(name, set); }
        if (!set.has(fn)) {
          set.add(fn);
          if (entry!.es) entry!.es.addEventListener(name, fn as EventListenerOrEventListenerObject);
        }
      });
    }

    // ensure the ES is open
    openUrl(url, entry);

    console.debug('useSharedEventSource subscribe', { url, refCount: entry.refCount });
    return () => {
      const e = sharedMap.get(url);
      if (!e) return;
      e.refCount -= 1;
      console.debug('useSharedEventSource unsubscribe', { url, refCount: e.refCount });
      if (handlers.onOpen) e.openHandlers.delete(handlers.onOpen);
      if (handlers.onError) e.errorHandlers.delete(handlers.onError);
      if (handlers.onMessage) e.genericListeners.delete(handlers.onMessage);
      if (handlers.events) {
        Object.entries(handlers.events).forEach(([name, fn]) => {
          const set = e.namedListeners.get(name);
          if (set) set.delete(fn);
          try { if (e.es) e.es.removeEventListener(name, fn as EventListenerOrEventListenerObject); } catch (err) {}
        });
      }
      closeEntryIfUnused(url);
    };
  // only recreate subscription when url or enabled change
  }, [url, enabled]);
}
