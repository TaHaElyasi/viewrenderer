import { Component, QueryList, ViewChild, ViewChildren, ViewContainerRef, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { TabComponent } from './tab.component';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-tabs',
  standalone: true,
  imports: [NgFor, NgClass, TabComponent],
  template: `
    <div class="ui-tabs">
      <div class="ui-tabs-header">
        <div 
          class="ui-tab-header-item" 
          *ngFor="let tab of items; let i = index" 
          [ngClass]="{active: i === activeIndex}"
          (click)="select(i)">
          {{ tab.label || ('تب ' + (i+1)) }}
        </div>
      </div>
      <div class="ui-tabs-content">
        <ng-container #contentHost></ng-container>
      </div>
    </div>
  `,
  styles: [`
    .ui-tabs-header { display: flex; gap: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px; }
    .ui-tab-header-item { padding: 6px 10px; border-radius: 8px 8px 0 0; cursor: pointer; }
    .ui-tab-header-item.active { background: #eef2ff; color: #3730a3; font-weight: 600; }
  `]
})
export class TabsComponent implements AfterViewInit, OnChanges, WidgetComponent {
  @ViewChildren(TabComponent) tabs?: QueryList<TabComponent>;
  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  public items: TabComponent[] = [];

  @Input() activeIndex = 0;
  @Input() attrs?: Record<string, any>;

  select(i: number) {
    this.activeIndex = i;
    this.updateActiveStates();
  }

  ngAfterViewInit() {
    // apply default from attrs after view init too
    this.syncFromAttrs();
    this.updateActiveStates();
    this.tabs?.changes.subscribe(() => this.updateActiveStates());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attrs']) {
      this.syncFromAttrs();
    }
  }

  private syncFromAttrs() {
    if (this.attrs && typeof this.attrs['activeIndex'] === 'number') {
      this.activeIndex = this.attrs['activeIndex'];
    }
  }

  register(tab: TabComponent) {
    this.items.push(tab);
    this.updateActiveStates();
  }

  unregister(tab: TabComponent) {
    const idx = this.items.indexOf(tab);
    if (idx > -1) this.items.splice(idx, 1);
    if (this.activeIndex >= this.items.length) this.activeIndex = Math.max(0, this.items.length - 1);
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
}