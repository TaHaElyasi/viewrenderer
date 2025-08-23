import { ViewContainerRef } from '@angular/core';

export interface WidgetComponent {
  // Generic attributes object that all widgets can use
  attrs?: Record<string, any>;
  
  // Content host for nested components (optional)
  contentHost?: ViewContainerRef;
}