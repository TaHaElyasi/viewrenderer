import { Inject, Injectable, InjectionToken, Optional, Injector, Provider } from '@angular/core';

export interface RepoActionHandler {
  readonly repo: string;
  readonly action: string;
  invoke(query: Record<string, any>, callerInj?: Injector): Promise<any>;
}

export const REPO_HANDLERS = new InjectionToken<RepoActionHandler[]>('REPO_HANDLERS');

// Helper to register a repo/action handler with minimal boilerplate
export function provideRepoHandler(
  repo: string,
  action: string,
  invoker: (injector: Injector, query: Record<string, any>) => Promise<any>,
): Provider {
  return {
    provide: REPO_HANDLERS,
    multi: true,
    deps: [Injector],
    useFactory: (appInj: Injector): RepoActionHandler => ({
      repo,
      action,
      // Prefer caller injector when provided (local component subtree)
      invoke: (query, callerInj?: Injector) => invoker(callerInj ?? appInj, query),
    }),
  };
}

@Injectable({ providedIn: 'root' })
export class RepoRegistryService {
  constructor(
    @Optional() @Inject(REPO_HANDLERS) private handlers: RepoActionHandler[] | null,
  ) {}

  async invoke(repoKey: string, action: string, query: Record<string, any>, callerInj?: Injector): Promise<any> {
    const repo = (repoKey || '').toLowerCase();
    const act = (action || '').toLowerCase();

    const list = this.handlers ?? [];
    const handler = list.find(
      (h) => h.repo.toLowerCase() === repo && h.action.toLowerCase() === act,
    );

    if (!handler) {
      throw new Error(`No handler registered for repo='${repoKey}' action='${action}'`);
    }

    return handler.invoke(query, callerInj);
  }
}