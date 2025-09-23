import { Component } from '@angular/core';
import { AtomicBaseWidgetComponent } from '../../services/atomic-base-widget.component';

@Component({
    selector: 'app-row',
    template: `
      <div class="flex flex-row flex-wrap items-start w-full overflow-x-hidden lg:flex-col lg:gap-3">
        <ng-container #contentHost></ng-container>
      </div>
    `,
    standalone: true,
})
export class RowComponent extends AtomicBaseWidgetComponent{




}
