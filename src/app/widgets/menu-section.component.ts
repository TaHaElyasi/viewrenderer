import { Component, Input, ViewChild, ViewContainerRef, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu.component';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
    selector: 'ui-menu-section',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <section class="ui-menu-section block mb-10 scroll-mt-24 max-w-full overflow-x-hidden" [attr.id]="resolvedId" data-menu-section>
            <h2 *ngIf="resolvedTitle as t" class="text-xl font-semibold mb-3 text-gray-800">{{ t }}</h2>
            <ng-container #contentHost></ng-container>
        </section>
    `,
})
export class MenuSectionComponent implements WidgetComponent, OnInit, AfterViewInit, OnDestroy, OnChanges {
    @Input() id?: string;
    @Input() title?: string;
    @Input() attrs?: Record<string, any>;

    @ViewChild('contentHost', { read: ViewContainerRef, static: true })
    public contentHost!: ViewContainerRef;

    private parent = inject(MenuComponent, { optional: true });
    private cdr = inject(ChangeDetectorRef);

    get resolvedId(): string | undefined { return this.id || this.attrs?.['id']; }
    get resolvedTitle(): string | undefined { return this.title || this.attrs?.['title']; }

    ngOnInit(): void {
        this.syncFromAttrs();
        if (!this.id) {
            const base = this.slugify(this.title || this.attrs?.['title'] || 'section');
            this.id = this.parent?.nextAutoId(base) || base;
        }
    }

    ngAfterViewInit(): void {
        this.parent?.register(this);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['attrs']) {
            this.syncFromAttrs();
        }
    }

    ngOnDestroy(): void {
        this.parent?.unregister(this);
    }

    private syncFromAttrs() {
        if (!this.attrs) return;
        let changed = false;
        if (typeof this.attrs['id'] === 'string' && this.id !== this.attrs['id']) { this.id = this.attrs['id']; changed = true; }
        if (typeof this.attrs['title'] === 'string' && this.title !== this.attrs['title']) { this.title = this.attrs['title']; changed = true; }
        if (changed) this.cdr.markForCheck();
    }

    private slugify(str: string): string {
        return (str || '')
            .toString()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-\u0600-\u06FF]+/g, '')
            .replace(/\-+/g, '-');
    }
}
