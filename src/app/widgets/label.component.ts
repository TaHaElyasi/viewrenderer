import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-label',
  standalone: true,
  template: `
    <span [style.color]="attrs?.['color'] ?? color" class="ui-label">
      {{ attrs?.['text'] ?? text }}
    </span>
    <ng-container #contentHost></ng-container>
  `,
  styles: [`
    .ui-label { font-size: 14px; line-height: 1.5; }
  `]
})
export class LabelComponent implements WidgetComponent {
  @Input() text: string = '';
  @Input() color?: string;
  @Input() attrs?: Record<string, any>;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;
}