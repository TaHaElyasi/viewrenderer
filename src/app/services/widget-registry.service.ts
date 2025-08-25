import { Injectable, Type } from '@angular/core';
import { LabelComponent } from '../widgets/label.component';
import { ButtonComponent } from '../widgets/button.component';
import { CardComponent } from '../widgets/card.component';
import { TabsComponent } from '../widgets/tabs.component';
import { TabComponent } from '../widgets/tab.component';

interface WidgetRegistration {
  component: Type<any>;
  isAtomic: boolean;
}

@Injectable({ providedIn: 'root' })
export class WidgetRegistryService {
  private registry = new Map<string, WidgetRegistration>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    this.register('label', LabelComponent, false);
    this.register('button', ButtonComponent, false);
    this.register('card', CardComponent, true); // atomic widget
    this.register('tabs', TabsComponent, false);
    this.register('tab', TabComponent, true); // atomic widget
  }

  register(tag: string, component: Type<any>, isAtomic: boolean = false) {
    this.registry.set(tag.toLowerCase(), { component, isAtomic });
  }

  get(tag: string): Type<any> | undefined {
    const registration = this.registry.get(tag.toLowerCase());
    return registration?.component;
  }

  isAtomic(tag: string): boolean {
    const registration = this.registry.get(tag.toLowerCase());
    return registration?.isAtomic || false;
  }

  has(tag: string): boolean {
    return this.registry.has(tag.toLowerCase());
  }

  clear() {
    this.registry.clear();
  }

  entries(): [string, WidgetRegistration][] {
    return Array.from(this.registry.entries());
  }
}