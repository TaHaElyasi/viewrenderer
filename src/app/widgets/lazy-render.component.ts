import { Component, Input, ViewChild, ViewContainerRef, AfterViewInit, ElementRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtomicRendererService } from '../services/atomic-renderer.service';

@Component({
  selector: 'lazy-render',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lazy-wrapper" #wrapper>
      <div class="lazy-loading" *ngIf="!rendered">
        <div class="spinner"></div>
        <div class="text">در حال بارگذاری...</div>
      </div>
      <ng-container #host></ng-container>
    </div>
  `,
  styles: [`
    .lazy-wrapper { display: block; min-height: 48px; }
    .lazy-loading { display: flex; align-items: center; gap: 8px; color: #6b7280; padding: 8px 0; }
    .spinner { width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LazyRenderComponent implements AfterViewInit, OnDestroy {
  @Input() xml?: string;
  @Input() delayMs: number = 2000; // default 2s delay after entering viewport

  @ViewChild('host', { read: ViewContainerRef, static: true })
  private host!: ViewContainerRef;

  private el = inject(ElementRef<HTMLElement>);
  private atomic = inject(AtomicRendererService);
  private io?: IntersectionObserver;
  private timeoutId: any;
  rendered = false;
  private started = false;

  ngAfterViewInit(): void {
    // If xml is empty, nothing to do
    if (!this.xml?.trim()) {
      this.rendered = true;
      return;
    }

    // Setup IntersectionObserver
    this.io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting && !this.started) {
        this.started = true;
        // Delay rendering by delayMs
        this.timeoutId = setTimeout(() => {
          // Render and clean up
          this.host.clear();
          this.atomic.renderXmlContent(this.xml!, this.host);
          this.rendered = true;
          this.cleanup();
        }, this.delayMs);
      }
    }, { root: null, rootMargin: '0px', threshold: 0 });

    this.io.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup() {
    if (this.io) {
      try { this.io.disconnect(); } catch {}
      this.io = undefined;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}