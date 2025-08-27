import { Component, Input, ViewChild, ViewContainerRef, OnInit, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsComponent } from './tabs.component';
import { WidgetComponent } from '../interfaces/widget.interface';
import { AtomicRendererService } from '../services/atomic-renderer.service';

@Component({
  selector: 'app-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.css']
})
export class TabComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit, WidgetComponent {
  @Input() label: string = '';
  @Input() attrs?: Record<string, any>;
  @Input() isAtomic?: boolean;
  @Input() xmlContent?: string;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  private parentTabs = inject(TabsComponent, { optional: true });
  private atomicRenderer = inject(AtomicRendererService);
  private viewInitialized = false;
  private hasRendered = false;
  private _active: boolean = false;

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
    if (!this.contentHost || !this.xmlContent) return;
    if (this.hasRendered && !force) return;
    this.contentHost.clear();
    this.atomicRenderer.renderXmlContent(this.xmlContent, this.contentHost);
    this.hasRendered = true;
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    // Render atomic content after view is initialized only if this tab is active
    if (this.isAtomic && this.xmlContent && this.active && !this.hasRendered) {
      Promise.resolve().then(() => this.renderAtomicContent());
    }
  }

  ngOnDestroy(): void {
    this.parentTabs?.unregister(this);
  }
}