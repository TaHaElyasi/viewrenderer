import { Component } from '@angular/core';
import { AtomicBaseWidgetComponent } from '../../services/atomic-base-widget.component';

@Component({
    selector: 'app-column',
    template: `
      <div class="flex flex-col">
        <ng-container #contentHost></ng-container>
      </div>
    `,
    standalone: true,
})
export class ColumnComponent extends AtomicBaseWidgetComponent {
}
