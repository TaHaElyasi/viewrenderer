import { Injectable } from '@angular/core';

export interface FetchOptions {
  url: string;
  method?: string;
  headers?: any;
  timeoutMs?: number;
  body?: any;
}

export interface FetchResult {
  ok: boolean;
  data: any;
  contentType: string | null;
}

@Injectable({ providedIn: 'root' })
export class FetchHttpService {
  async fetch(opts: FetchOptions): Promise<FetchResult> {
    const method = (opts.method || 'GET').toString().toUpperCase();
    const timeoutMs = Math.max(1, Number(opts.timeoutMs ?? 8000));

    // Parse headers flexibly (JSON string or "k:v;k2:v2")
    let headers: Record<string, string> | undefined;
    const headersRaw = opts.headers;
    if (typeof headersRaw === 'string') {
      try { headers = JSON.parse(headersRaw); }
      catch {
        try {
          headers = Object.fromEntries(
            headersRaw
              .split(';')
              .map(p => p.trim())
              .filter(Boolean)
              .map(p => {
                const idx = p.indexOf(':');
                if (idx === -1) return [p.trim(), ''] as [string, string];
                return [p.slice(0, idx).trim(), p.slice(idx + 1).trim()] as [string, string];
              })
          );
        } catch {
          headers = undefined;
        }
      }
    } else if (headersRaw && typeof headersRaw === 'object') {
      headers = headersRaw as Record<string, string>;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const init: RequestInit = { method, headers, signal: controller.signal };
      if (method !== 'GET' && opts.body != null) {
        init.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
        if (!headers || !('Content-Type' in headers)) {
          init.headers = { ...(headers || {}), 'Content-Type': 'application/json' } as any;
        }
      }

      const response = await fetch(opts.url, init);
      const ok = !!response && response.ok;
      const contentType = response.headers.get('content-type');

      let data: any = undefined;
      if (ok) {
        try {
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else if (contentType && contentType.startsWith('text/')) {
            data = await response.text();
          } else {
            data = await response.arrayBuffer();
          }
        } catch {
          // ignore parsing errors
          data = undefined;
        }
      }

      return { ok, data, contentType };
    } catch {
      return { ok: false, data: undefined, contentType: null };
    } finally {
      clearTimeout(timer);
    }
  }
}