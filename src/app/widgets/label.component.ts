import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-label',
  standalone: true,
  template: `
    <span class="text-sm leading-6" [style.color]="attrs?.['color'] ?? color">
      {{ attrs?.['text'] ?? text }}
    </span>
    <ng-container #contentHost></ng-container>
  `
})
export class LabelComponent implements WidgetComponent {
  @Input() text: string = '';
  @Input() color?: string;
  @Input() attrs?: Record<string, any>;

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;
}