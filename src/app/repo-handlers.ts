import { Provider, Injector } from '@angular/core';
import { provideRepoHandler } from './services/repo-registry.service';
import { RelationRepository } from './repository/relation-repository';
import { RelationContext } from './services/relation-context';

export const REPO_HANDLER_PROVIDERS: Provider[] = [
  provideRepoHandler('relation', 'getrelations', async (inj: Injector, query: Record<string, any>) => {
    const repo = inj.get(RelationRepository);

    // Try to get id from RelationContext in the current injector subtree; fallback to query
    let id: string | string[] | undefined;
    try {
      const ctx = inj.get(RelationContext);
      let cur: any = (ctx as any).current ? (ctx as any).current() : undefined;
      if (cur == null && (ctx as any).peek) cur = (ctx as any).peek();
      if (cur == null && 'value' in (ctx as any)) cur = (ctx as any).value;
      if (cur != null) id = cur as any;
    } catch {
      // ignore if not provided in this subtree
    }

    if (id == null) {
      id = (query['id'] ?? query['Id'] ?? query['ids']) as any;
    }

    if (typeof id === 'string') {
      const t = id.trim();
      id = t.includes(',') ? t.split(',').map((s: string) => s.trim()).filter(Boolean) : t;
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

    const { lastValueFrom } = await import('rxjs');
    return await lastValueFrom(repo.getRelations(id as any, relationTypes as any, page, pageSize));
  }),
];