import { Component, Input, ViewChild, ViewContainerRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, NgFor, NgClass } from '@angular/common';
import { MenuSectionComponent } from './menu-section.component';
import { WidgetComponent } from '../interfaces/widget.interface';
import { AtomicRendererService } from '../services/atomic-renderer.service';
import { XmlParserService } from '../services/xml-parser.service';

@Component({
    selector: 'ui-menu',
    standalone: true,
    imports: [CommonModule, NgFor, NgClass, MenuSectionComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="ui-menu flex flex-row items-start w-full" [ngClass]="{ 'gap-6': items.length > 0 }">
      <!-- Sidebar (right in RTL) -->
      <div *ngIf="items.length > 0" class="ui-menu-sidebar relative md:sticky md:top-6 shrink-0 w-full md:w-[220px] bg-transparent md:max-h-[calc(100vh-48px)] md:overflow-visible md:pr-4">
        <!-- Vertical rail & dots -->
        <div class="ui-menu-rail hidden md:block absolute inset-y-0 right-0 w-[3px] bg-amber-500 rounded"></div>
        <span
          *ngFor="let item of items; let i = index; trackBy: trackByItem"
          class="ui-menu-dot hidden md:block absolute -right-[5px] translate-y-[-50%] w-3 h-3 bg-gray-300 border-2 border-white rounded-full shadow ring-1 ring-gray-200"
          [ngClass]="{ 'bg-amber-500 ring-amber-500': i === activeIndex() }"
          [style.top.%]="dotPositions[i]"
        ></span>

        <!-- Card container for items -->
        <div class="ui-menu-card card bg-base-100 shadow-sm border border-base-200 rounded-xl">
          <ul class="ui-menu-list flex flex-col gap-2 p-2">
            <li *ngFor="let item of items; let i = index; trackBy: trackByItem">
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
    private xmlParser = inject(XmlParserService);
    private cdr = inject(ChangeDetectorRef);
    private zone = inject(NgZone);

    items: { id: string; title?: string }[] = [];
    dotPositions: number[] = [];
    private _activeIndex = signal(0);
    activeIndex = computed(() => this._activeIndex());

    private observer?: IntersectionObserver;
    private resizeHandler?: () => void;
    private mutationObserver?: MutationObserver;
    private rebuildScheduled = false;
    private xmlSectionOrder: string[] = [];
    private resizeRafPending = false;

    trackByItem = (_: number, it: { id: string; title?: string }) => it.id;

    private getRootEl(): HTMLElement | null {
        const anchor: any = this.contentHost.element?.nativeElement;
        return (anchor && anchor.parentElement) ? (anchor.parentElement as HTMLElement) : (anchor as HTMLElement);
    }

    // Document-relative top position helper
    private getDocumentTop(el: HTMLElement): number {
        const rect = el.getBoundingClientRect();
        return rect.top + window.scrollY;
    }

    private reobserveSections() {
        if (!this.observer) return;
        const rootEl = this.getRootEl();
        const sections = rootEl?.querySelectorAll('[data-menu-section]');
        if (!sections || !sections.length) return;
        this.observer.disconnect();
        sections.forEach(sec => this.observer!.observe(sec as Element));
    }

    // Deterministically collect sections in DOM order by walking the tree
    private collectSectionsInDomOrder(root: HTMLElement): HTMLElement[] {
        const out: HTMLElement[] = [];
        const walk = (node: Node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const el = node as HTMLElement;
            if (el.matches && el.matches('[data-menu-section]')) {
                out.push(el);
                return; // do not traverse inside a section; treat section as atomic block
            }
            const children = el.childNodes;
            for (let i = 0; i < children.length; i++) {
                walk(children[i]);
            }
        };
        walk(root);
        return out;
    }

    private computeXmlSectionOrder() {
        this.xmlSectionOrder = [];
        const xml = this.xmlContent || '';
        if (!xml.trim()) return;
        const parsed = this.xmlParser.parse(xml);
        if (!parsed.root || parsed.error) return;
        const root = parsed.root as Element;
        const walk = (node: Node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const el = node as Element;
            const tag = el.tagName.toLowerCase();
            if (tag === 'menu-section') {
                const idAttr = el.getAttribute('id');
                if (idAttr) this.xmlSectionOrder.push(idAttr);
                // do not traverse into section children
                return;
            }
            const children = Array.from(el.childNodes);
            for (const ch of children) walk(ch);
        };
        walk(root);
    }

    private scheduleRebuild() {
        if (this.rebuildScheduled) return;
        this.rebuildScheduled = true;
        // دو فریم صبر کن تا بایندینگ‌ها روی DOM اعمال شوند
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.rebuildScheduled = false;
                this.rebuildItemsFromDom();
                this.reobserveSections();
                this.updateRail();
                this.cdr.markForCheck();
            });
        });
    }

    private setRootMenuEmpty(flag: boolean) {
        const contentEl = this.getRootEl();
        if (contentEl) {
            const wrapper = contentEl.closest('.ui-menu') as HTMLElement | null;
            if (wrapper) {
                try { wrapper.dataset['menuEmpty'] = flag ? 'true' : 'false'; } catch {}
            }
        }
    }

    register(section: MenuSectionComponent) {
        const id = section.id!;
        const title = section.title;
        if (!this.items.some(i => i.id === id)) {
            this.items = [...this.items, { id, title }];
            this.cdr.markForCheck();
        }
    }

    unregister(section: MenuSectionComponent) {
        const beforeLen = this.items.length;
        this.items = this.items.filter(i => i.id !== section.id);
        if (this.items.length !== beforeLen) this.cdr.markForCheck();
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
        this.computeXmlSectionOrder();
        // Mark as empty until sections are discovered
        this.setRootMenuEmpty(true);
        this.renderer.renderXmlContent(this.xmlContent!, this.contentHost);
        // ابتدا spy را راه‌اندازی کن، سپس بازسازی را زمان‌بندی کن تا بعد از اعمال بایندینگ انجام شود
        queueMicrotask(() => {
            this.setupSpy();
            this.attachLocalLoadingListeners();
            this.scheduleRebuild();
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

    private arraysEqual(a: { id: string; title?: string }[], b: { id: string; title?: string }[]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].id !== b[i].id || a[i].title !== b[i].title) return false;
        }
        return true;
    }

    private rebuildItemsFromDom() {
        const rootEl = this.getRootEl();
        if (!rootEl) return;
        let sections = this.collectSectionsInDomOrder(rootEl);
        if (!sections.length) { this.setRootMenuEmpty(true); return; }

        // If we have XML-declared order (by id), sort the existing sections to match it
        if (this.xmlSectionOrder.length) {
            const orderIndex = new Map<string, number>();
            this.xmlSectionOrder.forEach((id, idx) => orderIndex.set(id, idx));
            sections = sections.slice().sort((a, b) => {
                const ia = orderIndex.has(a.id) ? (orderIndex.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
                const ib = orderIndex.has(b.id) ? (orderIndex.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
                if (ia !== ib) return ia - ib;
                // fallback to DOM order if both unknown
                return 0;
            });
        }

        const newItems: { id: string; title?: string }[] = [];
        sections.forEach((sec) => {
            const idAttr = sec.getAttribute('id');
            if (!idAttr) {
                // اگر هنوز id ست نشده، این سکشن را موقتاً نادیده بگیر تا در بازسازی بعدی وارد شود
                return;
            }
            const titleEl = sec.querySelector('h2');
            const title = titleEl ? titleEl.textContent?.trim() || undefined : undefined;
            newItems.push({ id: idAttr, title });
        });
        if (!newItems.length) return;
        if (!this.arraysEqual(this.items, newItems)) {
            this.items = newItems;
            if (this._activeIndex() >= this.items.length) this._activeIndex.set(Math.max(0, this.items.length - 1));
            this.cdr.markForCheck();
        }
        // We have sections; mark as non-empty
        this.setRootMenuEmpty(false);
    }

    // Local loading listener stub (to be filled if needed for showing a spinner)
    private attachLocalLoadingListeners(): void {
        // Intentionally left blank for now; prevents TS error when called.
    }

    private setupSpy() {
        this.observer?.disconnect();
        this.mutationObserver?.disconnect();
        const rootEl = this.getRootEl();
        const options = { root: null, rootMargin: '0px 0px -55% 0px', threshold: 0.1 } as IntersectionObserverInit;

        // Run observer callbacks خارج از Zone برای کاهش تریگر CD
        this.zone.runOutsideAngular(() => {
            this.observer = new IntersectionObserver((entries) => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible.length) {
                    const target = visible[0].target as HTMLElement;
                    const id = target.id;
                    const idx = this.items.findIndex(x => x.id === id);
                    if (idx !== -1) {
                        this.zone.run(() => {
                            this._activeIndex.set(idx);
                            this.cdr.markForCheck();
                        });
                    }
                }
            }, options);
        });

        this.reobserveSections();

        // resize listener for rail (throttled by rAF)
        this.resizeHandler = () => {
            if (this.resizeRafPending) return;
            this.resizeRafPending = true;
            requestAnimationFrame(() => {
                this.resizeRafPending = false;
                this.updateRail();
                this.cdr.markForCheck();
            });
        };
        window.addEventListener('resize', this.resizeHandler);

        // Observe DOM mutations to capture dynamically added/removed sections and تغییر id
        if (rootEl) {
            this.zone.runOutsideAngular(() => {
                this.mutationObserver = new MutationObserver((mutations) => {
                    let changed = false;
                    for (const m of mutations) {
                        if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
                            changed = true;
                            break;
                        }
                        if (m.type === 'attributes' && (m.target as Element).matches?.('[data-menu-section]') && (m.attributeName === 'id')) {
                            changed = true;
                            break;
                        }
                    }
                    if (changed) {
                        this.zone.run(() => this.scheduleRebuild());
                    }
                });
                this.mutationObserver!.observe(rootEl, { childList: true, subtree: true, attributes: true, attributeFilter: ['id'] });
            });
        }
    }

    private updateRail() {
        const rootEl = this.getRootEl();
        if (!rootEl) return;
        const sections = this.collectSectionsInDomOrder(rootEl);
        if (!sections.length) return;

        // Map sections by id, then order them to match this.items (which may be XML order)
        const byId = new Map<string, HTMLElement>();
        sections.forEach(sec => { if (sec.id) byId.set(sec.id, sec); });
        const orderedSections: HTMLElement[] = [];
        for (const it of this.items) {
            const sec = byId.get(it.id);
            if (sec) orderedSections.push(sec);
        }
        // If for some reason mapping failed, fall back to DOM order
        const finalSections = orderedSections.length ? orderedSections : sections;

        const contentTop = this.getDocumentTop(rootEl);
        const contentHeight = Math.max(rootEl.scrollHeight, rootEl.offsetHeight, 1);

        const positions = finalSections.map(sec => {
            const yRel = this.getDocumentTop(sec) - contentTop;
            const pct = Math.min(100, Math.max(0, (yRel / contentHeight) * 100));
            return +pct.toFixed(2);
        });

        if (positions.every(p => isNaN(p))) {
            this.dotPositions = finalSections.map((_, i) => finalSections.length > 1 ? (i * 100 / (finalSections.length - 1)) : 0);
        } else {
            this.dotPositions = positions;
        }
        this.cdr.markForCheck();
    }

    onClickItem(i: number, id: string) {
        this._activeIndex.set(i);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
}
