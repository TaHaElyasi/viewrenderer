import { Component, Input, ViewChild, ViewContainerRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, signal, computed, inject } from '@angular/core';
import { CommonModule, NgFor, NgClass } from '@angular/common';
import { WidgetComponent } from '../interfaces/widget.interface';
import { AtomicRendererService } from '../services/atomic-renderer.service';
import { MenuSectionComponent } from './menu-section.component';

@Component({
  selector: 'ui-menu',
  standalone: true,
  imports: [CommonModule, NgFor, NgClass, MenuSectionComponent],
  template: `
    <div class="ui-menu flex flex-row items-start gap-6 w-full">
      <!-- Sidebar (right in RTL) -->
      <div class="ui-menu-sidebar relative md:sticky md:top-6 shrink-0 w-full md:w-[220px] bg-transparent md:max-h-[calc(100vh-48px)] md:overflow-visible md:pr-4">
        <!-- Vertical rail & dots -->
        <div class="ui-menu-rail hidden md:block absolute inset-y-0 right-0 w-[3px] bg-amber-500 rounded"></div>
        <span
          *ngFor="let item of items; let i = index"
          class="ui-menu-dot hidden md:block absolute -right-[5px] translate-y-[-50%] w-3 h-3 bg-gray-300 border-2 border-white rounded-full shadow ring-1 ring-gray-200"
          [ngClass]="{ 'bg-amber-500 ring-amber-500': i === activeIndex() }"
          [style.top.%]="dotPositions[i] ?? (items.length > 1 ? (i * 100 / (items.length - 1)) : 0)"
        ></span>

        <!-- Card container for items -->
        <div class="ui-menu-card card bg-base-100 shadow-sm border border-base-200 rounded-xl">
          <ul class="ui-menu-list flex flex-col gap-2 p-2">
            <li *ngFor="let item of items; let i = index">
              <a
                (click)="onClickItem(i, item.id)"
                class="btn btn-ghost btn-sm normal-case justify-start w-full text-right bg-white border border-base-300 rounded-lg transition-all"
                [ngClass]="i === activeIndex() ? 'bg-amber-500 text-white border-amber-500' : 'hover:border-amber-500 hover:text-gray-800 text-gray-700'"
              >
                <span class="title inline-block">{{ item.title || ('بخش ' + (i+1)) }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Content (left in RTL) -->
      <div class="ui-menu-content relative z-[1] flex-1 min-w-0 overflow-x-hidden w-full">
        <ng-container #contentHost></ng-container>
      </div>
    </div>
  `,
})
export class MenuComponent implements WidgetComponent, AfterViewInit, OnChanges, OnDestroy {
  @Input() attrs?: Record<string, any>;
  @Input() isAtomic?: boolean;
  @Input() xmlContent?: string;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  private renderer = inject(AtomicRendererService);

  items: { id: string; title?: string }[] = [];
  dotPositions: number[] = [];
  private _activeIndex = signal(0);
  activeIndex = computed(() => this._activeIndex());

  private observer?: IntersectionObserver;
  private resizeHandler?: () => void;
  private mutationObserver?: MutationObserver;

  private getRootEl(): HTMLElement | null {
    const anchor: any = this.contentHost.element?.nativeElement;
    return (anchor && anchor.parentElement) ? (anchor.parentElement as HTMLElement) : (anchor as HTMLElement);
  }

  private reobserveSections() {
    if (!this.observer) return;
    const rootEl = this.getRootEl();
    const sections = rootEl?.querySelectorAll('[data-menu-section]');
    if (!sections || !sections.length) return;
    this.observer.disconnect();
    sections.forEach(sec => this.observer!.observe(sec as Element));
  }

  register(section: MenuSectionComponent) {
    const id = section.id!;
    const title = section.title;
    if (!this.items.some(i => i.id === id)) {
      this.items.push({ id, title });
    }
  }

  unregister(section: MenuSectionComponent) {
    const idx = this.items.findIndex(i => i.id === section.id);
    if (idx > -1) this.items.splice(idx, 1);
  }

  nextAutoId(base: string): string {
    let i = 1;
    let id = base;
    const existing = new Set(this.items.map(x => x.id));
    while (existing.has(id)) { id = base + '-' + (++i); }
    return id;
  }

  private renderChildren() {
    this.contentHost.clear();
    this.items = [];
    this.dotPositions = [];
    this._activeIndex.set(0);
    this.renderer.renderXmlContent(this.xmlContent!, this.contentHost);
    queueMicrotask(() => {
      this.rebuildItemsFromDom();
      this.setupSpy();
      this.updateRail();
    });
  }

  ngAfterViewInit(): void {
    if (this.isAtomic && this.xmlContent) {
      Promise.resolve().then(() => this.renderChildren());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isAtomic && this.xmlContent && this.contentHost) {
      this.renderChildren();
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    this.mutationObserver?.disconnect();
  }

  private rebuildItemsFromDom() {
    const rootEl = this.getRootEl();
    if (!rootEl) return;
    const sections = Array.from(rootEl.querySelectorAll('[data-menu-section]')) as HTMLElement[];
    if (!sections.length) return;
    const newItems = sections.map((sec, idx) => {
      const titleEl = sec.querySelector('h2');
      const title = titleEl ? titleEl.textContent?.trim() || undefined : undefined;
      const id = sec.id || `section-${idx+1}`;
      if (!sec.id) sec.id = id;
      return { id, title };
    });
    this.items = newItems;
    if (this._activeIndex() >= this.items.length) this._activeIndex.set(Math.max(0, this.items.length - 1));
  }

  private setupSpy() {
    this.observer?.disconnect();
    this.mutationObserver?.disconnect();
    const rootEl = this.getRootEl();
    const sections = rootEl?.querySelectorAll('[data-menu-section]');
    if (!sections || !sections.length) return;
    const options = { root: null, rootMargin: '0px 0px -55% 0px', threshold: 0.1 } as IntersectionObserverInit;
    this.observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) {
        const target = visible[0].target as HTMLElement;
        const id = target.id;
        const idx = this.items.findIndex(x => x.id === id);
        if (idx !== -1) this._activeIndex.set(idx);
      }
    }, options);

    this.reobserveSections();

    // resize listener for rail
    this.resizeHandler = () => this.updateRail();
    window.addEventListener('resize', this.resizeHandler);

    // Observe DOM mutations to capture dynamically added/removed sections (e.g., from context)
    if (rootEl) {
      this.mutationObserver = new MutationObserver((mutations) => {
        let needRebuild = false;
        for (const m of mutations) {
          if (m.type === 'childList') {
            m.addedNodes.forEach(n => {
              if (n instanceof HTMLElement && (n.matches?.('[data-menu-section]') || n.querySelector?.('[data-menu-section]'))) needRebuild = true;
            });
            m.removedNodes.forEach(n => {
              if (n instanceof HTMLElement && (n.matches?.('[data-menu-section]') || n.querySelector?.('[data-menu-section]'))) needRebuild = true;
            });
          }
        }
        if (needRebuild) {
          this.rebuildItemsFromDom();
          this.reobserveSections();
          this.updateRail();
        }
      });
      this.mutationObserver.observe(rootEl, { childList: true, subtree: true });
    }
  }

  private updateRail() {
    const rootEl = this.getRootEl();
    if (!rootEl) return;
    const sections = Array.from(rootEl.querySelectorAll('[data-menu-section]')) as HTMLElement[];
    if (!sections.length) return;

    const contentHeight = Math.max(rootEl.scrollHeight, rootEl.offsetHeight, 1);

    const getOffset = (el: HTMLElement, ancestor: HTMLElement) => {
      let y = 0; let node: HTMLElement | null = el;
      while (node && node !== ancestor) { y += node.offsetTop || 0; node = node.offsetParent as HTMLElement | null; }
      return y;
    };

    const positions = sections.map(sec => {
      const y = getOffset(sec, rootEl);
      const pct = Math.min(100, Math.max(0, (y / contentHeight) * 100));
      return +pct.toFixed(2);
    });

    if (positions.every(p => isNaN(p))) {
      this.dotPositions = sections.map((_, i) => sections.length > 1 ? (i * 100 / (sections.length - 1)) : 0);
    } else {
      this.dotPositions = positions;
    }
  }

  onClickItem(i: number, id: string) {
    this._activeIndex.set(i);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}