import { Component, Input } from '@angular/core';
import { WidgetComponent } from '@core/components/other/dev-test/view-rendrer/interfaces/widget.interface';

@Component({
  selector: 'app-atomic-base-widget',
  standalone: true,
  imports: [],
  template: '',
})
export class BaseWidgetComponent implements WidgetComponent {


    @Input() attrs?: Record<string, any>;
    @Input() text: string = '';


}
