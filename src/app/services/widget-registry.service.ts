import { Injectable, Type } from '@angular/core';
import { LabelComponent } from '../widgets/label.component';
import { ButtonComponent } from '../widgets/button.component';
import { CardComponent } from '../widgets/card.component';
import { TabsComponent } from '../widgets/tabs.component';
import { TabComponent } from '../widgets/tab.component';

@Injectable({ providedIn: 'root' })
export class WidgetRegistryService {
  private registry = new Map<string, Type<any>>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    this.register('label', LabelComponent);
    this.register('button', ButtonComponent);
    this.register('card', CardComponent);
    this.register('tabs', TabsComponent);
    this.register('tab', TabComponent);
  }

  register(tag: string, component: Type<any>) {
    this.registry.set(tag.toLowerCase(), component);
  }

  get(tag: string): Type<any> | undefined {
    return this.registry.get(tag.toLowerCase());
  }

  has(tag: string): boolean {
    return this.registry.has(tag.toLowerCase());
  }

  clear() {
    this.registry.clear();
  }

  entries(): [string, Type<any>][] {
    return Array.from(this.registry.entries());
  }
}