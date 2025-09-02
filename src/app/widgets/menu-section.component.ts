import { Component, Input, ViewChild, ViewContainerRef, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetComponent } from '../interfaces/widget.interface';
import { MenuComponent } from './menu.component';

@Component({
  selector: 'ui-menu-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="ui-menu-section" [attr.id]="resolvedId" data-menu-section>
      <h2 *ngIf="resolvedTitle as t" class="ui-menu-section-title">{{ t }}</h2>
      <ng-container #contentHost></ng-container>
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; overflow-x: hidden; }
    .ui-menu-section { display: block; margin-bottom: 40px; scroll-margin-top: 96px; max-width: 100%; overflow-x: hidden; }
    .ui-menu-section-title { font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #1f2937; }
  `]
})
export class MenuSectionComponent implements WidgetComponent, OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() id?: string;
  @Input() title?: string;
  @Input() attrs?: Record<string, any>;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  private parent = inject(MenuComponent, { optional: true });

  get resolvedId(): string | undefined { return this.id || this.attrs?.['id']; }
  get resolvedTitle(): string | undefined { return this.title || this.attrs?.['title']; }

  ngOnInit(): void {
    this.syncFromAttrs();
    if (!this.id) {
      const base = this.slugify(this.title || this.attrs?.['title'] || 'section');
      this.id = this.parent?.nextAutoId(base) || base;
    }
  }

  ngAfterViewInit(): void {
    this.parent?.register(this);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attrs']) {
      this.syncFromAttrs();
    }
  }

  ngOnDestroy(): void {
    this.parent?.unregister(this);
  }

  private syncFromAttrs() {
    if (!this.attrs) return;
    if (typeof this.attrs['id'] === 'string') this.id = this.attrs['id'];
    if (typeof this.attrs['title'] === 'string') this.title = this.attrs['title'];
  }

  private slugify(str: string): string {
    return (str || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-\u0600-\u06FF]+/g, '')
      .replace(/\-+/g, '-');
  }
}