import { Component, EventEmitter, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `
    <button class="ui-button" [style.background]="(attrs?.['color'] ?? color) || '#4f46e5'" (click)="clicked.emit()">
      {{ attrs?.['label'] ?? label }}
    </button>
    <ng-container #contentHost></ng-container>
  `,
  styles: [`
    .ui-button { 
      color: white; 
      border: none; 
      padding: 8px 14px; 
      border-radius: 8px; 
      cursor: pointer; 
      font-weight: 600; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .ui-button:hover { filter: brightness(1.05); }
  `]
})
export class ButtonComponent implements WidgetComponent {
  @Input() label: string = 'دکمه';
  @Input() color?: string;
  @Input() attrs?: Record<string, any>;
  @Output() clicked = new EventEmitter<void>();

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;
}