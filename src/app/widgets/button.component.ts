import { Component, EventEmitter, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="btn btn-primary font-semibold" [ngStyle]="{ background: (attrs?.['color'] ?? color) || undefined }" (click)="clicked.emit()">
      {{ attrs?.['label'] ?? label }}
    </button>
    <ng-container #contentHost></ng-container>
  `
})
export class ButtonComponent implements WidgetComponent {
  @Input() label: string = 'دکمه';
  @Input() color?: string;
  @Input() attrs?: Record<string, any>;
  @Output() clicked = new EventEmitter<void>();

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;
}