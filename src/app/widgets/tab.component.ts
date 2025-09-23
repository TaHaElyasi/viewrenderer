import { Component, Input, ViewChild, ViewContainerRef, OnInit, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsComponent } from './tabs.component';
import { WidgetComponent } from '../interfaces/widget.interface';
import { AtomicRendererService } from '../services/atomic-renderer.service';

@Component({
  selector: 'app-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class.hidden]="!active">
      <div class="tab-content" #containerEl>
        <ng-container #contentHost></ng-container>
      </div>
      <div class="empty-placeholder text-slate-500 text-sm p-2" *ngIf="active && showEmpty">
        محتوایی وجود ندارد
      </div>
    </div>
  `
})
export class TabComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit, WidgetComponent {
  @Input() label: string = '';
  @Input() attrs?: Record<string, any>;
  @Input() isAtomic?: boolean;
  @Input() xmlContent?: string;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;
  @ViewChild('containerEl', { static: true })
  private containerEl!: ElementRef<HTMLElement>;

  private parentTabs = inject(TabsComponent, { optional: true });
  private atomicRenderer = inject(AtomicRendererService);
  private viewInitialized = false;
  private hasRendered = false;
  private _active: boolean = false;
  
  showEmpty = false;
  private mutationObserver?: MutationObserver;

  @Input()
  get active(): boolean {
    return this._active;
  }
  set active(val: boolean) {
    const becameActive = !!val && !this._active;
    this._active = !!val;
    // When tab becomes active for the first time after view init, render its atomic content once
    if (becameActive && this.viewInitialized && this.isAtomic && this.xmlContent && !this.hasRendered) {
      this.renderAtomicContent();
    }
    // Re-evaluate empty state when activation changes
    this.scheduleEmptyCheck();
  }

  ngOnInit(): void {
    // Sync from attrs on start
    if (this.attrs) {
      if (typeof this.attrs['label'] === 'string') this.label = this.attrs['label'];
      if (typeof this.attrs['active'] === 'boolean') this.active = this.attrs['active'];
    }
    this.parentTabs?.register(this);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-sync from attrs when they change
    if (changes['attrs'] && this.attrs) {
      if (typeof this.attrs['label'] === 'string') this.label = this.attrs['label'];
      if (typeof this.attrs['active'] === 'boolean') this.active = this.attrs['active'];
    }
    
    // If XML content or atomic flag changes and we've already rendered before, re-render
    if (this.viewInitialized && this.isAtomic && this.xmlContent && (changes['xmlContent'] || changes['isAtomic'])) {
      this.renderAtomicContent(true);
    }
  }

  private renderAtomicContent(force: boolean = false): void {
    if (!this.contentHost) return;
    if (this.hasRendered && !force) return;
    this.contentHost.clear();

    // If xml is empty/whitespace, mark as rendered and check empty state
    if (!this.xmlContent || !this.xmlContent.trim()) {
      this.hasRendered = true;
      this.scheduleEmptyCheck();
      return;
    }

    this.atomicRenderer.renderXmlContent(this.xmlContent, this.contentHost);
    this.hasRendered = true;
    this.scheduleEmptyCheck();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    // Render atomic content after view is initialized only if this tab is active
    if (this.isAtomic && this.xmlContent && this.active && !this.hasRendered) {
      Promise.resolve().then(() => this.renderAtomicContent());
    }
    // Also check empty state initially in case there is no content at all
    this.scheduleEmptyCheck();

    // Observe dynamic changes inside the container to reflect empty/non-empty state
    this.mutationObserver = new MutationObserver(() => this.updateEmptyState());
    this.mutationObserver.observe(this.containerEl.nativeElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  ngOnDestroy(): void {
    this.parentTabs?.unregister(this);
    this.mutationObserver?.disconnect();
  }

  private scheduleEmptyCheck(): void {
    Promise.resolve().then(() => this.updateEmptyState());
  }

  private updateEmptyState(): void {
    if (!this.containerEl) { this.showEmpty = false; return; }
    const el = this.containerEl.nativeElement;

    // Detect embedded menu with no sections
    const menuRoot = el.querySelector('.ui-menu') as HTMLElement | null;
    const menuEmpty = !!(menuRoot && menuRoot.dataset && menuRoot.dataset['menuEmpty'] === 'true');

    // Ignore the placeholder itself and hidden structures; detect real, visible content or non-whitespace text
    const hasText = (el.innerText || '').trim().length > 0;

    const nodeList = Array.from(el.querySelectorAll('*')) as HTMLElement[];
    const hasVisibleElements = nodeList.some((he) => {
      if (he.classList.contains('empty-placeholder')) return false;
      const style = window.getComputedStyle(he);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return he.offsetWidth > 0 || he.offsetHeight > 0;
    });

    this.showEmpty = !(hasText || hasVisibleElements) || menuEmpty;
  }
}