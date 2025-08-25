import { Injectable, ViewContainerRef, inject } from '@angular/core';
import { WidgetRegistryService } from './widget-registry.service';
import { XmlParserService } from './xml-parser.service';

@Injectable({ providedIn: 'root' })
export class AtomicRendererService {
  private widgets = inject(WidgetRegistryService);
  private xmlParser = inject(XmlParserService);

  renderXmlContent(xmlContent: string, container: ViewContainerRef): void {
    container.clear();
    if (!xmlContent?.trim()) return;

    const result = this.xmlParser.parse(xmlContent);
    if (result.error) {
      const LabelComp = this.widgets.get('label');
      if (LabelComp) {
        const compRef = container.createComponent(LabelComp);
        compRef.setInput('attrs', { text: 'XML نامعتبر: ' + result.error, color: '#b91c1c' });
      }
      return;
    }

    const root = result.root!;
    Array.from(root.childNodes).forEach(node => this.renderNode(node, container));
  }

  private renderNode(node: Node, container: ViewContainerRef): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim();
      if (text) {
        const LabelComp = this.widgets.get('label');
        if (LabelComp) {
          const labelRef = container.createComponent(LabelComp);
          labelRef.setInput('attrs', { text });
        }
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const comp = this.widgets.get(tag);
    if (!comp) {
      const LabelComp = this.widgets.get('label');
      if (LabelComp) {
        const labelRef = container.createComponent(LabelComp);
        labelRef.setInput('attrs', { text: `ناشناخته: <${tag}>`, color: '#b45309' });
      }
      return;
    }

    const compRef = container.createComponent(comp);

    // Build attrs object
    const attrs: Record<string, any> = {};
    for (const attr of Array.from(el.attributes)) {
      const camel = this.kebabToCamel(attr.name);
      const coerced = this.coerce(attr.value);
      attrs[attr.name] = coerced;
      attrs[camel] = coerced;
    }

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

    if (tag === 'tabs' && hasOwnContentHost) {
      Array.from(el.childNodes).forEach(ch => this.renderNode(ch, instance.contentHost));
      return;
    }

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
}