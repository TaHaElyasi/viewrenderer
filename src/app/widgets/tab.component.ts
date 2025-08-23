import { Component, Input, ViewChild, ViewContainerRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsComponent } from './tabs.component';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-tab" [style.display]="(attrs?.['active'] ?? active) ? 'block' : 'none'">
      <ng-container #contentHost></ng-container>
    </div>
  `,
  styles: [`
    .ui-tab { padding: 8px 0; }
  `]
})
export class TabComponent implements OnInit, OnDestroy, WidgetComponent {
  @Input() label: string = '';
  @Input() active: boolean = false;
  @Input() attrs?: Record<string, any>;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  private parentTabs = inject(TabsComponent, { optional: true });

  ngOnInit(): void {
    // Sync from attrs on start
    if (this.attrs) {
      if (typeof this.attrs['label'] === 'string') this.label = this.attrs['label'];
      if (typeof this.attrs['active'] === 'boolean') this.active = this.attrs['active'];
    }
    this.parentTabs?.register(this);
  }

  ngOnDestroy(): void {
    this.parentTabs?.unregister(this);
  }
}