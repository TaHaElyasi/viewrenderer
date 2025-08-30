import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AtomicRendererService, RendererHooks } from '../services/atomic-renderer.service'

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

  @Output() formSubmit = new EventEmitter<any>()
  @Output() formChange = new EventEmitter<any>()
  @Output() inputChange = new EventEmitter<any>()

  @ViewChild('host', { read: ViewContainerRef, static: true })
  private host!: ViewContainerRef

  constructor(private readonly atomicRenderer: AtomicRendererService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['xml']) {
      const hooks: RendererHooks = {
        onFormSubmit: (payload) => this.formSubmit.emit(payload),
        onFormChange: (payload) => this.formChange.emit(payload),
        onInputChange: (payload) => this.inputChange.emit(payload)
      }
      this.atomicRenderer.setHooks(hooks)
      this.atomicRenderer.renderXmlContent(this.xml, this.host)
    }
  }
}