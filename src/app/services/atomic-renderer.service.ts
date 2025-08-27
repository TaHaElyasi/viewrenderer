import { Injectable, ViewContainerRef, inject, Component, Input } from '@angular/core';
import { WidgetRegistryService } from './widget-registry.service';
import { XmlParserService } from './xml-parser.service';
import { LazyRenderComponent } from '../widgets/lazy-render.component';

export interface RendererHooks {
  onFormSubmit?: (event: { tag: string; attrs: Record<string, any>; value: any; key?: string }) => void;
  onFormChange?: (event: { tag: string; attrs: Record<string, any>; value: any; key?: string }) => void;
  onInputChange?: (event: { tag: string; attrs: Record<string, any>; name?: string; value: any }) => void;
}

// Internal lightweight component to render plain text nodes without relying on any widget
@Component({
  selector: 'internal-text-node',
  standalone: true,
  template: `{{ text }}`,
})
class InternalTextNodeComponent {
  @Input() text: string = '';
}

@Injectable({ providedIn: 'root' })
export class AtomicRendererService {
  private widgets = inject(WidgetRegistryService);
  private xmlParser = inject(XmlParserService);
  private hooks?: RendererHooks;

  // counter used to assign implicit keys to forms without id/name
  private formAutoInc = 0;

  setHooks(hooks?: RendererHooks) {
    this.hooks = hooks;
    // reset counter on new render cycle via setHooks caller
    this.formAutoInc = 0;
  }

  renderXmlContent(xmlContent: string, container: ViewContainerRef): void {
    container.clear();
    if (!xmlContent?.trim()) return;

    const result = this.xmlParser.parse(xmlContent);
    if (result.error) {
      // Avoid dependency on a specific widget; just render error text plainly
      const errRef = container.createComponent(InternalTextNodeComponent);
      try { errRef.setInput('text', 'XML نامعتبر: ' + result.error); } catch {}
      return;
    }

    const root = result.root!;
    Array.from(root.childNodes).forEach(node => this.renderNode(node, container));
  }

  private renderNode(node: Node, container: ViewContainerRef): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim();
      if (text) {
        const textRef = container.createComponent(InternalTextNodeComponent);
        try { textRef.setInput('text', text); } catch {}
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    // Build attrs early to detect lazy configuration
    const attrs: Record<string, any> = {};
    for (const attr of Array.from(el.attributes)) {
      const camel = this.kebabToCamel(attr.name);
      const coerced = this.coerce(attr.value);
      attrs[attr.name] = coerced;
      attrs[camel] = coerced;
    }

    // Lazy loading: if configured, defer rendering using LazyRenderComponent
    const lazy = !!(attrs['lazy'] ?? attrs['lazyLoad'] ?? attrs['lazy-load']);
    if (lazy) {
      const lazyRef = container.createComponent(LazyRenderComponent);
      const delay = typeof attrs['lazyDelay'] === 'number' ? attrs['lazyDelay'] : (typeof attrs['lazy-delay'] === 'number' ? attrs['lazy-delay'] : 2000);
      try { lazyRef.setInput('delayMs', delay); } catch {}
      // Pass element XML without lazy attributes to prevent double wrapping
      const fullXml = this.serializeElementXmlWithoutLazy(el);
      try { lazyRef.setInput('xml', fullXml); } catch {}
      return;
    }

    const comp = this.widgets.get(tag);
    if (!comp) {
      // No registered component; render children (flatten unknown tag) to keep renderer generic
      Array.from(el.childNodes).forEach(ch => this.renderNode(ch, container));
      return;
    }

    const compRef = container.createComponent(comp);

    // Check if this widget is atomic
    const isAtomic = this.widgets.isAtomic(tag);
    
    // Pass attrs
    try { compRef.setInput('attrs' as any, attrs); } catch {}
    
    // Set atomic properties
    const instance: any = compRef.instance as any;
    if (isAtomic && instance) {
      try { compRef.setInput('isAtomic' as any, true); } catch {}
      
      // Use XMLSerializer to extract inner XML instead of el.innerHTML
      const innerXml = this.serializeInnerXml(el);
      if (innerXml.trim()) {
        try { compRef.setInput('xmlContent' as any, innerXml); } catch {}
      }
    }

    // Wire up well-known outputs for specific widgets (e.g., form)
    if (tag === 'form') {
      const submitted = (instance && instance.submitted) || (compRef as any).submitted;
      const valueChange = (instance && instance.valueChange) || (compRef as any).valueChange;
      const key = (attrs['id'] ?? attrs['name'] ?? `form_${++this.formAutoInc}`) as string;
      if (submitted && typeof submitted.subscribe === 'function' && this.hooks?.onFormSubmit) {
        try { submitted.subscribe((payload: any) => this.hooks?.onFormSubmit?.({ tag, attrs, value: payload, key })); } catch {}
      }
      if (valueChange && typeof valueChange.subscribe === 'function' && this.hooks?.onFormChange) {
        try { valueChange.subscribe((payload: any) => this.hooks?.onFormChange?.({ tag, attrs, value: payload, key })); } catch {}
      }
    }

    // Generic subscription for input-like widgets or any widget exposing 'changed' or 'valueChange'
    const changed = (instance && instance.changed) || (compRef as any).changed;
    if (changed && typeof changed.subscribe === 'function' && this.hooks?.onInputChange) {
      try {
        changed.subscribe((payload: any) => {
          const value = typeof payload === 'object' && payload && 'value' in payload ? payload.value : payload;
          const name = (typeof payload === 'object' && payload && 'name' in payload) ? payload.name : (attrs['name'] ?? undefined);
          this.hooks?.onInputChange?.({ tag, attrs, name, value });
        });
      } catch {}
    }
    const valueChangeGeneric = (instance && instance.valueChange) || (compRef as any).valueChange;
    if (valueChangeGeneric && typeof valueChangeGeneric.subscribe === 'function' && this.hooks?.onInputChange && tag !== 'form') {
      try {
        valueChangeGeneric.subscribe((payload: any) => {
          const value = typeof payload === 'object' && payload && 'value' in payload ? payload.value : payload;
          const name = (typeof payload === 'object' && payload && 'name' in payload) ? payload.name : (attrs['name'] ?? undefined);
          this.hooks?.onInputChange?.({ tag, attrs, name, value });
        });
      } catch {}
    }

    // Set direct inputs for backward compatibility
    for (const key of Object.keys(attrs)) {
      try { compRef.setInput(key as any, attrs[key]); } catch {}
    }

    // For atomic widgets, don't render children here
    if (isAtomic) {
      return;
    }

    // Render children for non-atomic widgets
    const hasOwnContentHost = instance && instance.contentHost && typeof instance.contentHost.createComponent === 'function';

    // Generic handling: if component exposes a contentHost, use it; otherwise, use current container
    const childContainer: ViewContainerRef = hasOwnContentHost ? instance.contentHost : container;
    Array.from(el.childNodes).forEach(ch => this.renderNode(ch, childContainer));
  }

  private kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (_: any, c: string) => c.toUpperCase());
  }

  private coerce(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value)) && value.trim() !== '') return Number(value);
    return value;
  }

  // Serialize child nodes of an XML element to string
  private serializeInnerXml(el: Element): string {
    const serializer = new XMLSerializer();
    let xml = '';
    el.childNodes.forEach((n: Node) => {
      xml += serializer.serializeToString(n);
    });
    return xml;
  }

  // Serialize the element itself (including its start/end tags and children)
  private serializeElementXml(el: Element): string {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(el);
  }

  // Serialize element but remove lazy-related attributes to prevent nested lazy wrappers
  private serializeElementXmlWithoutLazy(el: Element): string {
    const clone = el.cloneNode(true) as Element;
    clone.removeAttribute('lazy');
    clone.removeAttribute('lazy-load');
    clone.removeAttribute('lazyLoad');
    clone.removeAttribute('lazyDelay');
    clone.removeAttribute('lazy-delay');
    const serializer = new XMLSerializer();
    return serializer.serializeToString(clone);
  }
}