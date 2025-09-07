import { Injectable } from '@angular/core';

export interface TypeConfig {
  url: string;
  method?: string; // default GET
}

@Injectable({ providedIn: 'root' })
export class TypeRegistryService {
  // NOTE: Replace these placeholders with your real types
  private readonly map: Record<string, TypeConfig> = {
    users: { url: 'https://jsonplaceholder.typicode.com/users', method: 'GET' },
    search: { url: 'https://jsonplaceholder.typicode.com/comments', method: 'GET' },
    // جدید: نمونه type POST
    createpost: { url: 'https://jsonplaceholder.typicode.com/posts', method: 'POST' },
  };

  resolve(key: string | undefined | null): TypeConfig | null {
    if (!key) return null;
    const k = String(key).trim().toLowerCase();
    return this.map[k] || null;
  }
}