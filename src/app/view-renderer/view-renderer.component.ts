import { Component, Input, OnChanges, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { WidgetRegistryService } from '../services/widget-registry.service'
import { XmlParserService } from '../services/xml-parser.service'
import { LazyRenderComponent } from '../widgets/lazy-render.component'

@Component({
  selector: 'app-view-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-renderer">
      <ng-container #host></ng-container>
    </div>
  `,
  styles: [`
    .view-renderer { display: block; }
  `]
})
export class ViewRendererComponent implements OnChanges {
  @Input() xml: string = ''

  @ViewChild('host', { read: ViewContainerRef, static: true })
  private host!: ViewContainerRef

  constructor(
    private readonly widgets: WidgetRegistryService,
    private readonly xmlParser: XmlParserService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['xml']) {
      this.render()
    }
  }

  private render() {
    this.host.clear()
    if (!this.xml) return

    const result = this.xmlParser.parse(this.xml)
    if (result.error) {
      const LabelComp = this.widgets.get('label')
      if (LabelComp) {
        const compRef = this.host.createComponent(LabelComp)
        compRef.setInput('attrs', { text: 'XML نامعتبر: ' + result.error, color: '#b91c1c' })
      }
      return
    }

    const root = result.root!
    Array.from(root.childNodes).forEach(node => this.renderNode(node, this.host))
  }

  private renderNode(node: Node, container: ViewContainerRef, parentComp?: any) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim()
      if (text) {
        const LabelComp = this.widgets.get('label')
        if (LabelComp) {
          const labelRef = container.createComponent(LabelComp)
          labelRef.setInput('attrs', { text })
        }
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as Element
    const tag = el.tagName.toLowerCase()

    // Build attrs early to detect lazy configuration
    const attrs: Record<string, any> = {}
    for (const attr of Array.from(el.attributes)) {
      const camel = this.kebabToCamel(attr.name)
      const coerced = this.coerce(attr.value)
      attrs[attr.name] = coerced
      attrs[camel] = coerced
    }

    // Lazy loading: if configured, defer rendering using LazyRenderComponent
    const lazy = !!(attrs['lazy'] ?? attrs['lazyLoad'] ?? attrs['lazy-load'])
    if (lazy) {
      const lazyRef = container.createComponent(LazyRenderComponent)
      // Optional override for delay; default 2000ms
      const delay = typeof attrs['lazyDelay'] === 'number' ? attrs['lazyDelay'] : (typeof attrs['lazy-delay'] === 'number' ? attrs['lazy-delay'] : 2000)
      try { lazyRef.setInput('delayMs', delay) } catch {}
      // Pass element XML without lazy attributes to avoid double lazy wrapping
      const fullXml = this.serializeElementXmlWithoutLazy(el)
      try { lazyRef.setInput('xml', fullXml) } catch {}
      return
    }

    const comp = this.widgets.get(tag)
    if (!comp) {
      const LabelComp = this.widgets.get('label')
      if (LabelComp) {
        const labelRef = container.createComponent(LabelComp)
        labelRef.setInput('attrs', { text: `ناشناخته: <${tag}>`, color: '#b45309' })
      }
      return
    }

    const compRef = container.createComponent(comp)

    // Check if this widget is atomic
    const isAtomic = this.widgets.isAtomic(tag)
    
    // Pass generic attrs object
    try { compRef.setInput('attrs' as any, attrs) } catch {}
    
    // Set atomic flag and XML content for atomic widgets
    const instance: any = compRef.instance as any
    if (isAtomic && instance) {
      try { compRef.setInput('isAtomic' as any, true) } catch {}
      
      // Extract inner XML content for atomic widgets using XMLSerializer (innerHTML is unreliable in XML docs)
      const innerXml = this.serializeInnerXml(el)
      if (innerXml.trim()) {
        try { compRef.setInput('xmlContent' as any, innerXml) } catch {}
      }
    }

    // Also try to set direct inputs for backward compatibility (optional)
    for (const key of Object.keys(attrs)) {
      try { compRef.setInput(key as any, attrs[key]) } catch {}
    }

    // For atomic widgets, don't render children here - let the widget handle it internally
    if (isAtomic) {
      return
    }

    // Decide child container for non-atomic widgets
    const hasOwnContentHost = instance && instance.contentHost && typeof instance.contentHost.createComponent === 'function'

    if (tag === 'tabs' && hasOwnContentHost) {
      Array.from(el.childNodes).forEach(ch => this.renderNode(ch, instance.contentHost, compRef.instance))
      return
    }

    const childContainer: ViewContainerRef = hasOwnContentHost ? instance.contentHost : container
    Array.from(el.childNodes).forEach(ch => this.renderNode(ch, childContainer, compRef.instance))
  }

  private kebabToCamel(str: string) {
    return str.replace(/-([a-z])/g, (_: any, c: string) => c.toUpperCase())
  }

  private coerce(value: string): any {
    if (value === 'true') return true
    if (value === 'false') return false
    if (!isNaN(Number(value)) && value.trim() !== '') return Number(value)
    return value
  }

  // Serialize child nodes of an XML element to string
  private serializeInnerXml(el: Element): string {
    const serializer = new XMLSerializer()
    let xml = ''
    el.childNodes.forEach((n: Node) => {
      xml += serializer.serializeToString(n)
    })
    return xml
  }

  // Serialize the element itself (including its start/end tags and children)
  private serializeElementXml(el: Element): string {
    const serializer = new XMLSerializer()
    return serializer.serializeToString(el)
  }

  // Serialize element but remove lazy-related attributes to prevent nested lazy wrappers
  private serializeElementXmlWithoutLazy(el: Element): string {
    const clone = el.cloneNode(true) as Element
    clone.removeAttribute('lazy')
    clone.removeAttribute('lazy-load')
    clone.removeAttribute('lazyLoad')
    clone.removeAttribute('lazyDelay')
    clone.removeAttribute('lazy-delay')
    const serializer = new XMLSerializer()
    return serializer.serializeToString(clone)
  }
}