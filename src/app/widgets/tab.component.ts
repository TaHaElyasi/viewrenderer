import { Component, Input, ViewChild, ViewContainerRef, OnInit, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, inject, Injector } from '@angular/core';
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
  @Input() active: boolean = false;
  @Input() attrs?: Record<string, any>;
  @Input() isAtomic?: boolean;
  @Input() xmlContent?: string;
  @Input() context?: any;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  private parentTabs = inject(TabsComponent, { optional: true });
  private atomicRenderer = inject(AtomicRendererService);
  private injector = inject(Injector);
  private viewInitialized = false;

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
    
    if (this.viewInitialized && this.isAtomic && this.xmlContent && (changes['xmlContent'] || changes['isAtomic'])) {
      this.renderAtomicContent();
    }
  }

  private renderAtomicContent(): void {
    if (this.contentHost && this.xmlContent) {
      this.contentHost.clear();
      this.atomicRenderer.renderXmlContent(this.xmlContent, this.contentHost, {
        injector: this.injector,
        context: this.context
      });
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    // Render atomic content after view is initialized (next tick to avoid ExpressionChanged)
    if (this.isAtomic && this.xmlContent) {
      Promise.resolve().then(() => this.renderAtomicContent());
    }
  }

  ngOnDestroy(): void {
    this.parentTabs?.unregister(this);
  }
}