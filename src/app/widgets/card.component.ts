import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-card">
      <div class="ui-card-header" *ngIf="(attrs?.['title'] ?? title)">{{ attrs?.['title'] ?? title }}</div>
      <div class="ui-card-body">
        <ng-container #contentHost></ng-container>
      </div>
    </div>
  `,
  styles: [`
    .ui-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: white; }
    .ui-card-header { font-weight: 700; margin-bottom: 8px; font-size: 16px; }
    .ui-card-body { font-size: 14px; }
  `]
})
export class CardComponent implements WidgetComponent {
  @Input() title?: string;
  @Input() attrs?: Record<string, any>;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;
}