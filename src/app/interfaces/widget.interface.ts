import { ViewContainerRef } from '@angular/core';

export interface WidgetComponent {
  // Generic attributes object that all widgets can use
  attrs?: Record<string, any>;
  
  // Content host for nested components (optional)
  contentHost?: ViewContainerRef;
  
  // Flag to indicate if this widget is atomic (can render XML content internally)
  isAtomic?: boolean;
  
  // Raw XML content for atomic widgets to render internally
  xmlContent?: string;
}