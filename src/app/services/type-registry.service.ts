import { Injectable } from '@angular/core';

export type HttpTypeConfig = {
  kind: 'http';
  url: string;
  method?: string; // default GET
};

export type RepoTypeConfig = {
  kind: 'repo';
  repo: 'relation'; // we can extend later for other repos
  action: 'getRelations';
};

export type TypeConfig = HttpTypeConfig | RepoTypeConfig;

@Injectable({ providedIn: 'root' })
export class TypeRegistryService {
  // Registry supports both http endpoints and repository actions
  private readonly map: Record<string, TypeConfig> = {
    // HTTP samples
    users: { kind: 'http', url: 'https://jsonplaceholder.typicode.com/users', method: 'GET' },
    search: { kind: 'http', url: 'https://jsonplaceholder.typicode.com/comments', method: 'GET' },
    createpost: { kind: 'http', url: 'https://jsonplaceholder.typicode.com/posts', method: 'POST' },

    // Repository-based sample
    relations: { kind: 'repo', repo: 'relation', action: 'getRelations' },
  };

  resolve(key: string | undefined | null): TypeConfig | null {
    if (!key) return null;
    const k = String(key).trim().toLowerCase();
    return this.map[k] || null;
  }
}