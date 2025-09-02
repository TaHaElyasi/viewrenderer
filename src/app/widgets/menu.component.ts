import { Component, Input, ViewChild, ViewContainerRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule, NgFor, NgClass } from '@angular/common';
import { WidgetComponent } from '../interfaces/widget.interface';
import { AtomicRendererService } from '../services/atomic-renderer.service';
import { MenuSectionComponent } from './menu-section.component';
import { inject } from '@angular/core';

@Component({
  selector: 'ui-menu',
  standalone: true,
  imports: [CommonModule, NgFor, NgClass, MenuSectionComponent],
  template: `
    <div class="ui-menu">
      <div class="ui-menu-sidebar">
        <ul class="ui-menu-list">
          <li *ngFor="let item of items; let i = index">
            <a [ngClass]="{active: i === activeIndex()}" (click)="onClickItem(i, item.id)">
              <span>{{ item.title || ('بخش ' + (i+1)) }}</span>
              <span class="ui-menu-badge" *ngIf="activeIndex() === i">در حال مشاهده</span>
            </a>
          </li>
        </ul>
      </div>

      <div class="ui-menu-content">
        <ng-container #contentHost></ng-container>
      </div>
    </div>
  `,
  styles: [`
    /* Layout with Flexbox only: force sidebar to the right using row-reverse */
    .ui-menu {
      display: flex;
      flex-direction: row;
      gap: 16px;
      align-items: flex-start;
      width: 100%;
    }

    /* Sidebar: fixed width, sticky, always above content */
    .ui-menu-sidebar {
      flex: 0 0 260px;
      width: 260px;
      position: sticky;
      top: 16px;
      align-self: flex-start;
      z-index: 10;
      background: #fff;
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* Content: fills remaining space, no horizontal scroll, children stacked */
    .ui-menu-content {
      position: relative;
      z-index: 1;
      flex: 1 1 auto;
      min-width: 0;
      overflow-x: hidden;
      width: 100%;
    }
    .ui-menu-content > * {
      display: block !important;
      width: 100% !important;
      max-width: 100%;
    }

    /* Vertical menu list */
    .ui-menu-list { list-style: none; margin: 0; padding: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; }
    .ui-menu-list li + li { border-top: 1px solid #e5e7eb; }
    .ui-menu-list a { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; color: #111827; text-decoration: none; cursor: pointer; }
    .ui-menu-list a.active { background: #eef2ff; color: #3730a3; font-weight: 600; }
    .ui-menu-badge { font-size: 12px; color: #6b7280; }

    /* Responsive: stack menu above content on small screens */
    @media (max-width: 1024px) {
      .ui-menu { flex-direction: column; }
      .ui-menu-sidebar { width: 100%; flex: 0 0 auto; position: static; z-index: auto; max-height: none; overflow: visible; }
      .ui-menu-content { width: 100%; }
    }
  `]
})
export class MenuComponent implements WidgetComponent, AfterViewInit, OnChanges, OnDestroy {
  @Input() attrs?: Record<string, any>;
  @Input() isAtomic?: boolean;
  @Input() xmlContent?: string;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  private renderer = inject(AtomicRendererService);

  items: { id: string; title?: string }[] = [];
  private _activeIndex = signal(0);
  activeIndex = computed(() => this._activeIndex());

  private observer?: IntersectionObserver;

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
    this._activeIndex.set(0);
    this.renderer.renderXmlContent(this.xmlContent!, this.contentHost);
    // After children rendered, rebuild items from DOM and setup spy in microtask
    queueMicrotask(() => {
      this.rebuildItemsFromDom();
      this.setupSpy();
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
  }

  private rebuildItemsFromDom() {
    const anchor: any = this.contentHost.element?.nativeElement;
    const rootEl: HTMLElement | null = (anchor && anchor.parentElement) ? anchor.parentElement as HTMLElement : (anchor as HTMLElement);
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
    // keep active index within range
    if (this._activeIndex() >= this.items.length) this._activeIndex.set(Math.max(0, this.items.length - 1));
  }

  private setupSpy() {
    this.observer?.disconnect();
    const anchor: any = this.contentHost.element?.nativeElement;
    const rootEl: HTMLElement | null = (anchor && anchor.parentElement) ? anchor.parentElement as HTMLElement : (anchor as HTMLElement);
    const sections = rootEl?.querySelectorAll('[data-menu-section]');
    if (!sections || !sections.length) return;
    const options = { root: null, rootMargin: '0px 0px -65% 0px', threshold: 0.1 } as IntersectionObserverInit;
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

    sections.forEach(sec => this.observer!.observe(sec));
  }

  onClickItem(i: number, id: string) {
    this._activeIndex.set(i);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ block: 'start' });
  }
}