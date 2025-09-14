import { Provider, Injector } from '@angular/core';
import { provideRepoHandler } from './services/repo-registry.service';
import { RelationRepository } from './repository/relation-repository';
import { RelationContext } from './services/relation-context';
import { lastValueFrom } from 'rxjs';
import { provideContextSetter } from './services/context-registry.service';

async function waitForContextId(inj: Injector, retries = 10, delayMs = 200): Promise<string | string[] | undefined> {
    const EntityCtx = inj.get(RelationContext);

    for (let i = 0; i < retries; i++) {
        const effective = EntityCtx.effectiveContext();
        if (effective?.id) {
            return effective.id;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return undefined;
}

// Context setters (renamed for clarity)
export const CONTEXT_SETTER_PROVIDERS: Provider[] = [
  // Register relation context setter for dynamic use from ContextComponent
  provideContextSetter('relation', (inj: Injector, value: any, extras) => {
    try {
      const ctx = inj.get(RelationContext);
      if (ctx && typeof (ctx as any).setContext === 'function') {
        (ctx as any).setContext(value);
      }
    } catch {}
  }),
];

// Repository handlers (kept separate from context setters)
export const REPO_HANDLER_PROVIDERS: Provider[] = [
  provideRepoHandler('relation', 'getrelations', async (inj: Injector, query: Record<string, any>) => {
    const repo = inj.get(RelationRepository);

    // Prefer id from query; if missing, fallback to RelationContext.effectiveContext
    let id: string | string[] | undefined = (query['id'] ?? query['Id'] ?? query['ids']) as any;

    if (id == null || (Array.isArray(id) && id.length === 0)) {
            try {
                id = await waitForContextId(inj);
            } catch {
                // ignore if RelationContext not available
            }
        }

        if (typeof id === 'string') {
            const t = id.trim();
            id = t.includes(',')
                ? t
                      .split(',')
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                : t;
        }

    let relationTypes: string | string[] | null | undefined = (query['relationTypes'] ?? query['types']) as any;
    if (typeof relationTypes === 'string') {
      const t = relationTypes.trim();
      relationTypes = t ? t.split(',').map((s: string) => s.trim()).filter(Boolean) : null;
    }
    if (relationTypes == null) relationTypes = null;

    const page: number | undefined = query['page'] != null ? Number(query['page']) : undefined;
    const pageSize: number | undefined = query['pageSize'] != null ? Number(query['pageSize']) : undefined;

    if (id == null || (Array.isArray(id) && id.length === 0)) {
      return [];
    }

    return await lastValueFrom(repo.getRelations(id as any, relationTypes as any, page, pageSize));
  }),
];