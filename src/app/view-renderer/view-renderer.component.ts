import { Component, Input, OnChanges, SimpleChanges, ViewChild, ViewContainerRef, Injector, EnvironmentInjector } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AtomicRendererService } from '../services/atomic-renderer.service'

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
  @Input() context?: any
  @Input() injector?: Injector
  @Input() environmentInjector?: EnvironmentInjector

  @ViewChild('host', { read: ViewContainerRef, static: true })
  private host!: ViewContainerRef

  constructor(private readonly atomicRenderer: AtomicRendererService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['xml'] || changes['context'] || changes['injector'] || changes['environmentInjector']) {
      this.atomicRenderer.renderXmlContent(this.xml, this.host, {
        injector: this.injector,
        environmentInjector: this.environmentInjector,
        context: this.context
      })
    }
  }
}