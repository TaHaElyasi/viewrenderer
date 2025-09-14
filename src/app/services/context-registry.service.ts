import { Inject, Injectable, InjectionToken, Optional, Injector, Provider } from '@angular/core';

export interface ContextProviderEntry {
  readonly key: string; // case-insensitive key
  set(injector: Injector, value: any, extras?: ContextSetExtras): void;
}

export interface ContextSetExtras {
  query?: Record<string, any>;
  attrs?: Record<string, any>;
}

export const CONTEXT_PROVIDERS = new InjectionToken<ContextProviderEntry[]>('CONTEXT_PROVIDERS');

export function provideContextSetter(
  key: string,
  setter: (injector: Injector, value: any, extras?: ContextSetExtras) => void,
): Provider {
  const normalized = (key || '').trim().toLowerCase();
  return {
    provide: CONTEXT_PROVIDERS,
    multi: true,
    useFactory: (): ContextProviderEntry => ({
      key: normalized,
      set: setter,
    }),
  } as Provider;
}

@Injectable({ providedIn: 'root' })
export class ContextRegistryService {
  constructor(@Optional() @Inject(CONTEXT_PROVIDERS) private readonly providers: ContextProviderEntry[] | null) {}

  /**
   * Set a context value dynamically by provider key (case-insensitive).
   * Returns true if a matching provider was found and set() was called; otherwise false.
   */
  set(key: string | undefined | null, value: any, injector: Injector, extras?: ContextSetExtras): boolean {
    if (!key) return false;
    const k = String(key).trim().toLowerCase();
    const list = this.providers ?? [];
    const entry = list.find(p => p.key === k);
    if (!entry) return false;
    try { entry.set(injector, value, extras); } catch {}
    return true;
  }
}