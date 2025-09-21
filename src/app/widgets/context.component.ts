import { Component, Input, ViewChild, ViewContainerRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy, inject, Injector } from '@angular/core'
import { CommonModule } from '@angular/common';
import { AtomicRendererService } from '../services/atomic-renderer.service';
import { LoadingService } from '../services/loading.service';
import { FetchHttpService } from '../services/fetch-http.service';
import { TypeRegistryService } from '../services/type-registry.service';
import { RepoRegistryService } from '../services/repo-registry.service';
import { lastValueFrom } from 'rxjs';
import { ContextRegistryService } from '../services/context-registry.service';
import { StateContext } from '../services/state-context';

@Component({
  selector: 'context',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container #contentHost></ng-container>
  `,
})
export class ContextComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() attrs?: Record<string, any>;
  @Input() isAtomic?: boolean;
  @Input() xmlContent?: string;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  private renderer = inject(AtomicRendererService);
  private loading = inject(LoadingService);
  private http = inject(FetchHttpService);
  private endpoints = inject(TypeRegistryService);
  private repos = inject(RepoRegistryService);
  private injector = inject(Injector);
  private contextRegistry = inject(ContextRegistryService);
  private stateContext = inject(StateContext);
  private aborted = false;

  ngAfterViewInit(): void {
    this.tryFetchAndRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attrs'] && !changes['attrs'].firstChange) {
      this.tryFetchAndRender();
    }
  }

  ngOnDestroy(): void {
    this.aborted = true;
  }

  private async tryFetchAndRender() {
    if (!this.isAtomic || !this.xmlContent) return;

    // Resolve URL and method either from direct url or type key
    const directUrl = this.attrs?.['url'];
    const endpointKey: string | undefined = this.attrs?.['type'];
    let url: string | null = null;
    let method = (this.attrs?.['method'] || '').toString().toUpperCase();
    let repo: any = null;
    // نگه‌داری کانفیگ رزولوشن برای استفاده بعدی (مثلاً contextProvider)
    let resolvedCfg: any = null;

    if (typeof directUrl === 'string' && directUrl.trim()) {
      url = directUrl.trim();
    } else if (endpointKey) {
      const resolved = this.endpoints.resolve(endpointKey);
      resolvedCfg = resolved;
      if (resolved) {
        if ((resolved as any).kind === 'http') {
          url = (resolved as any).url;
          if (!method) method = (((resolved as any).method) || 'GET').toUpperCase();
        } else if ((resolved as any).kind === 'repo') {
          repo = resolved;
        }
      }
    }

    if (!url && !repo) {
      // No source resolved; do not render
      this.clear();
      return;
    }

    if (url && !method) method = 'GET';

    // Build URL with params for GET requests if provided
    const headersRaw = this.attrs?.['headers'];
    const timeoutMs = Number(this.attrs?.['timeout'] ?? this.attrs?.['timeoutMs'] ?? 8000);
    const bodyRaw = this.attrs?.['body'];
    const paramsRaw = this.attrs?.['params'] ?? this.attrs?.['query'];
    const bodyIsExplicit = this.isExplicitBody(bodyRaw);

    // Collect extra attributes (non-reserved) to auto-map to params/body
    const extras: Record<string, any> = {};
    const baseReserved = [
      'type','url','method','headers','timeout','timeoutms',
      'successpath','path','mincount','min','requiretruthy','xmlcontent','isatomic',
      'lazy','lazyload','lazy-delay'
    ].map(s => s.toLowerCase());
    const reserved = new Set<string>(baseReserved);
    // params/query همیشه رزرو هستند تا به‌طور صریح استفاده شوند
    reserved.add('params');
    reserved.add('query');
    // کلید body فقط در حالتی رزرو است که متد GET باشد یا بدنه صریح تعیین شده باشد
    if (method === 'GET' || bodyIsExplicit) {
      reserved.add('body');
    }
    const seen = new Set<string>();
    for (const [k, v] of Object.entries(this.attrs || {})) {
      // prefer camelCase keys; skip kebab-case duplicates
      if (k.includes('-')) continue;
      const kl = k.toLowerCase();
      if (reserved.has(kl)) continue;
      const norm = k.replace(/-/g, '').toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      extras[k] = v;
    }

    if (url && method === 'GET') {
      const baseParams = this.parseParamsToObject(paramsRaw);
      const mergedParams = { ...extras, ...baseParams };
      if (Object.keys(mergedParams).length > 0) {
        url = this.buildUrlWithParams(url, mergedParams);
      }
    }

    // Start global loading for this context instance
    this.loading.begin();
    try {
      if (url) {
        let finalBody: any = undefined;
        if (method !== 'GET') {
          const baseBody = bodyIsExplicit ? this.parseBodyToObject(bodyRaw) : undefined;
          finalBody = { ...extras, ...(baseBody || {}) };
        }

        const { ok, data } = await this.http.fetch({ url, method, headers: headersRaw, timeoutMs, body: finalBody });

        if (this.aborted) return;
        if (!ok) { this.clear(); return; }

        const successPath = this.attrs?.['successPath'] || this.attrs?.['path'];
        const minCount = Number(this.attrs?.['minCount'] ?? this.attrs?.['min'] ?? 1);
        const requireTruthy = this.attrs?.['requireTruthy'] ?? true;

        const value = successPath ? this.getByPath(data, String(successPath)) : data;

        let allow = false;
        if (Array.isArray(value)) {
          allow = value.length >= minCount;
        } else if (typeof value === 'object' && value !== null) {
          allow = requireTruthy ? Object.keys(value).length > 0 : true;
        } else {
          allow = requireTruthy ? !!value : true;
        }

        if (allow || this.stateContext.effectiveContext()?.editMode) {
          this.contentHost.clear();
          this.renderer.renderXmlContent(this.xmlContent!, this.contentHost);
        } else {
          this.clear();
        }
      } else if (repo) {
         // Repository branch: dynamic via RepoRegistryService
         const baseParams = this.parseParamsToObject(paramsRaw);
         const query = { ...extras, ...baseParams } as Record<string, any>;

         // Dynamically set a Context via registry before invoking repo
         // Now we ONLY use registry-provided contextProvider; XML attrs are ignored.
         const contextProviderKey = (resolvedCfg as any)?.contextProvider as string | undefined;
         if (contextProviderKey) {
           const contextValue = (query as any)['id'] ?? (query as any)['ids'] ?? undefined;
           if (contextValue !== undefined) {
             try {
               this.contextRegistry.set(contextProviderKey, contextValue, this.injector, { query, attrs: this.attrs });
             } catch {}
           }
         }

         let repoData: any;
         try {
           repoData = await this.repos.invoke((repo as any).repo || 'relation', (repo as any).action || 'getRelations', query, this.injector);
         } catch {
           this.clear();
           return;
         }

         if (this.aborted) return;

         const successPath = this.attrs?.['successPath'] || this.attrs?.['path'];
         const minCount = Number(this.attrs?.['minCount'] ?? this.attrs?.['min'] ?? 1);
         const requireTruthy = this.attrs?.['requireTruthy'] ?? true;

         const value = successPath ? this.getByPath(repoData, String(successPath)) : repoData;

         let allow = false;
         if (Array.isArray(value)) {
           allow = value.length >= minCount;
         } else if (typeof value === 'object' && value !== null) {
           allow = requireTruthy ? Object.keys(value).length > 0 : true;
         } else {
           allow = requireTruthy ? !!value : true;
         }

         if (allow || this.stateContext.effectiveContext()?.editMode) {
           this.contentHost.clear();
           this.renderer.renderXmlContent(this.xmlContent!, this.contentHost);
         } else {
           this.clear();
         }
       }
    } finally {
      // Ensure we always end loading regardless of outcome
      this.loading.end();
    }
  }

  private clear() {
    try { this.contentHost?.clear(); } catch {}
  }

  private getByPath(obj: any, path: string): any {
    if (!path) return obj;
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p as any];
    }
    return cur;
  }

  private buildUrlWithParams(baseUrl: string, params: any): string {
    try {
      let query = '';
      if (params instanceof URLSearchParams) {
        query = params.toString();
      } else if (typeof params === 'string') {
        // If looks like JSON, parse to object then to query; otherwise assume already querystring
        const trimmed = params.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          const obj = JSON.parse(trimmed);
          query = new URLSearchParams(this.flattenParams(obj)).toString();
        } else {
          query = trimmed.replace(/^\?/, '');
        }
      } else if (typeof params === 'object' && params) {
        query = new URLSearchParams(this.flattenParams(params)).toString();
      }
      if (!query) return baseUrl;
      const hasQ = baseUrl.includes('?');
      return baseUrl + (hasQ ? '&' : '?') + query;
    } catch {
      return baseUrl;
    }
  }

  private flattenParams(obj: Record<string, any>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        // repeat key for arrays (k=a&k=b)
        v.forEach((item, idx) => {
          out[k] = out[k] ? `${out[k]}&${encodeURIComponent(k)}=${encodeURIComponent(String(item))}` : `${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`;
        });
      } else if (typeof v === 'object') {
        // simple JSON stringify for nested objects
        out[k] = JSON.stringify(v);
      } else {
        out[k] = String(v);
      }
    }
    return out;
  }

  private parseParamsToObject(params: any): Record<string, any> {
    if (!params) return {};
    try {
      if (params instanceof URLSearchParams) {
        const obj: Record<string, any> = {};
        params.forEach((value, key) => { obj[key] = value; });
        return obj;
      }
      if (typeof params === 'string') {
        const trimmed = params.trim();
        if (!trimmed) return {};
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          return JSON.parse(trimmed);
        }
        const usp = new URLSearchParams(trimmed.replace(/^\?/, ''));
        const obj: Record<string, any> = {};
        usp.forEach((value, key) => { obj[key] = value; });
        return obj;
      }
      if (typeof params === 'object') {
        return params as Record<string, any>;
      }
    } catch { /* ignore */ }
    return {};
  }

  private parseBodyToObject(body: any): Record<string, any> | undefined {
    if (body == null) return undefined;
    if (typeof body === 'string') {
      const trimmed = body.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try { return JSON.parse(trimmed); } catch { return {}; }
      }
      return undefined; // keep non-JSON string body ignored when merging with extras
    }
    if (typeof body === 'object') return body as Record<string, any>;
    return undefined;
  }

  private isExplicitBody(value: any): boolean {
    if (value == null) return false;
    if (typeof value === 'object') return true;
    if (typeof value === 'string') {
      const t = value.trim();
      return t.startsWith('{') && t.endsWith('}');
    }
    return false;
  }
}