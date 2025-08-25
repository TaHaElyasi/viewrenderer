import { Component, Input, ViewChild, ViewContainerRef, OnChanges, SimpleChanges, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetComponent } from '../interfaces/widget.interface';
import { AtomicRendererService } from '../services/atomic-renderer.service';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements WidgetComponent, OnChanges, AfterViewInit {
  @Input() title?: string;
  @Input() attrs?: Record<string, any>;
  @Input() isAtomic?: boolean;
  @Input() xmlContent?: string;

  private atomicRenderer = inject(AtomicRendererService);
  private viewInitialized = false;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  ngOnChanges(changes: SimpleChanges): void {
    // Sync title from attrs when they change
    if (changes['attrs'] && this.attrs) {
      if (typeof this.attrs['title'] === 'string') this.title = this.attrs['title'];
    }
    
    // Only render on changes after view is initialized to avoid ExpressionChanged errors
    if (this.viewInitialized && this.isAtomic && this.xmlContent && (changes['xmlContent'] || changes['isAtomic'])) {
      this.renderAtomicContent();
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    // Render atomic content after view is initialized (next tick to avoid ExpressionChanged)
    if (this.isAtomic && this.xmlContent) {
      Promise.resolve().then(() => this.renderAtomicContent());
    }
  }

  private renderAtomicContent(): void {
    if (this.contentHost && this.xmlContent) {
      this.contentHost.clear();
      this.atomicRenderer.renderXmlContent(this.xmlContent, this.contentHost);
    }
  }
}