import {
    AfterViewInit,
    Component,
    inject,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { WidgetComponent } from '../interfaces/widget.interface';
import { AtomicRendererService } from './atomic-renderer.service';

@Component({
  selector: 'app-atomic-base-widget',
  standalone: true,
  imports: [],
  template: '',
})
export class AtomicBaseWidgetComponent implements WidgetComponent, OnChanges, AfterViewInit {


    @Input() attrs?: Record<string, any>;
    @Input() isAtomic?: boolean;
    @Input() xmlContent?: string;

    protected atomicRenderer = inject(AtomicRendererService);
    protected viewInitialized = false;

    @ViewChild('contentHost', { read: ViewContainerRef, static: true })
    public contentHost!: ViewContainerRef;

    ngOnChanges(changes: SimpleChanges): void {
        // Only render on changes after view is initialized to avoid ExpressionChanged errors
        if (this.viewInitialized && this.isAtomic && this.xmlContent && (changes['xmlContent'] || changes['isAtomic'])) {
            this.renderAtomicContent();
        }
    }

    ngAfterViewInit(): void {
        this.viewInitialized = true;
        // Render atomic content after view is initialized (next tick to avoid ExpressionChanged)
        if (this.isAtomic && this.xmlContent) {
            Promise.resolve().then(() => this.renderAtomicContent());
        }
    }

    private renderAtomicContent(): void {
        if (this.contentHost && this.xmlContent) {
            this.contentHost.clear();
            this.atomicRenderer.renderXmlContent(this.xmlContent, this.contentHost);
        }
    }

}
