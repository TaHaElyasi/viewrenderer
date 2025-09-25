import { Component, QueryList, ViewChild, ViewChildren, ViewContainerRef, AfterViewInit, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { TabComponent } from './tab.component';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-tabs',
  standalone: true,
  imports: [NgFor, NgClass, TabComponent],
  template: `
    <div class="w-full">
      <div class="tabs tabs-bordered">
        <a class="tab" *ngFor="let tab of items; let i = index" [class.tab-active]="i === activeIndex" (click)="select(i)">
          {{ tab.label || ('تب ' + (i+1)) }}
        </a>
      </div>
      <div class="pt-2">
        <ng-container #contentHost></ng-container>
      </div>
    </div>
  `
})
export class TabsComponent implements AfterViewInit, OnChanges, OnDestroy, WidgetComponent {
  @ViewChildren(TabComponent) tabs?: QueryList<TabComponent>;
  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  public items: TabComponent[] = [];

  @Input() activeIndex = 0;
  @Input() attrs?: Record<string, any>;
  // New: Optional persistence key to keep active tab across reloads/mode switches
  @Input() persistKey?: string;
  // New: Flag to enable/disable fragment-based tab persistence
  @Input() persistInFragment: boolean = false;

  private onHashChange = () => {
    this.applyFromFragment();
    this.updateActiveStates();
  };
  // removed: private hashListenerAttached = false;

  select(i: number) {
    this.activeIndex = i;
    this.updateActiveStates();
    if (this.persistInFragment) {
      this.saveToFragment();
    }
  }

  ngAfterViewInit() {
    // apply default from attrs after view init too
    this.syncFromAttrs();
    // Apply any persisted active index from URL fragment (overrides default/attrs)
    if (this.persistInFragment) {
      this.applyFromFragment();
    }
    this.updateActiveStates();
    // React to runtime changes
    this.tabs?.changes.subscribe(() => {
      // When tabs list changes (registered/unregistered), re-apply persisted index safely
      if (this.persistInFragment) {
        this.applyFromFragment();
      }
      this.updateActiveStates();
    });
    // Listen to hash changes (browser back/forward or manual edits)
    if (this.persistInFragment) {
      this.attachHashListener();
    }
  }

  ngOnDestroy(): void {
    this.detachHashListener();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attrs']) {
      this.syncFromAttrs();
      // If persistKey provided/changed via attrs, try to restore state from fragment
      if (this.persistInFragment) {
        this.applyFromFragment();
      }
    }
    if (changes['persistInFragment']) {
      // Toggle fragment persistence at runtime
      if (this.persistInFragment) {
        this.attachHashListener();
        this.applyFromFragment();
        this.updateActiveStates();
      } else {
        this.detachHashListener();
      }
    }
  }

  private syncFromAttrs() {
    if (this.attrs) {
      if (typeof this.attrs['activeIndex'] === 'number') {
        this.activeIndex = this.attrs['activeIndex'];
      }
      if (typeof this.attrs['persistKey'] === 'string') {
        this.persistKey = this.attrs['persistKey'];
      } else if (typeof this.attrs['id'] === 'string' && !this.persistKey) {
        // fallback to id if provided
        this.persistKey = this.attrs['id'];
      }
      // read boolean-ish persistInFragment from attrs
      const pif = this.attrs['persistInFragment'];
      if (typeof pif === 'boolean') {
        this.persistInFragment = pif;
      } else if (typeof pif === 'string') {
        this.persistInFragment = ['true','1','yes','on'].includes(pif.trim().toLowerCase());
      }
    }
  }

  register(tab: TabComponent) {
    this.items.push(tab);
    // After a new tab is registered, re-apply persisted index and update states
    this.applyPersistedActiveIndex();
    this.updateActiveStates();
  }

  unregister(tab: TabComponent) {
    const idx = this.items.indexOf(tab);
    if (idx > -1) this.items.splice(idx, 1);
    if (this.activeIndex >= this.items.length) this.activeIndex = Math.max(0, this.items.length - 1);
    // After tab removal, re-apply persisted index within bounds
    this.applyPersistedActiveIndex();
    this.updateActiveStates();
  }

  private updateActiveStates() {
    const setActive = (t: TabComponent, idx: number) => (t.active = idx === this.activeIndex);

    if (this.items.length) {
      this.items.forEach(setActive);
    }
    if (this.tabs && this.tabs.length) {
      this.tabs.forEach(setActive);
    }
  }

  // Persistence helpers
  private clampIndex(i: number): number {
    if (!this.items.length) return 0;
    return Math.max(0, Math.min(i, this.items.length - 1));
  }

  private slugifyKey(s: string): string {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private getFragmentParamName(): string | null {
    const base = this.persistKey || this.deriveKey();
    if (!base) return null;
    return `tabs-${this.slugifyKey(base)}`;
  }

  private parseHash(hash: string): Record<string, string> {
    try {
      const raw = (hash || '').replace(/^#/, '');
      const params = new URLSearchParams(raw.startsWith('?') ? raw.substring(1) : raw);
      const out: Record<string, string> = {};
      params.forEach((v, k) => { out[k] = v; });
      return out;
    } catch {
      return {};
    }
  }

  private writeHash(params: Record<string, string>): void {
    try {
      const baseUrl = window.location.href.split('#')[0];
      const s = new URLSearchParams(params).toString();
      const next = s ? `${baseUrl}#${s}` : baseUrl;
      history.replaceState(null, '', next);
    } catch {
      // ignore
    }
  }

  private loadFromFragment(): number | null {
    if (!this.persistInFragment) return null;
    try {
      const key = this.getFragmentParamName();
      if (!key) return null;
      const map = this.parseHash(window.location.hash || '');
      if (!(key in map)) return null;
      const parsed = parseInt(map[key], 10);
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private saveToFragment(): void {
    if (!this.persistInFragment) return;
    try {
      const key = this.getFragmentParamName();
      if (!key) return;
      const map = this.parseHash(window.location.hash || '');
      map[key] = String(this.activeIndex);
      this.writeHash(map);
    } catch {
      // ignore
    }
  }

  private applyFromFragment(): void {
    if (!this.persistInFragment) return;
    const persisted = this.loadFromFragment();
    if (typeof persisted === 'number') {
      const clamped = this.clampIndex(persisted);
      if (this.activeIndex !== clamped) {
        this.activeIndex = clamped;
      }
    }
  }
  // Remove legacy localStorage persistence helpers
  private getStorageKey(): string | null { return null; }
  private loadPersisted(): number | null { return null; }
  private savePersisted(): void {}
  private applyPersistedActiveIndex(): void {
    if (this.persistInFragment) {
      this.applyFromFragment();
    }
  }
  private deriveKey(): string | null {
    try {
      const labels = this.items.map(t => t.label || '').join('|');
      const path = typeof window !== 'undefined' && window.location ? window.location.pathname : '';
      const key = (path + '|' + labels).trim();
      return key || null;
    } catch {
      return null;
    }
  }

  private attachHashListener(): void {
    try { window.addEventListener('hashchange', this.onHashChange); } catch {}
  }

  private detachHashListener(): void {
    try { window.removeEventListener('hashchange', this.onHashChange); } catch {}
  }
}