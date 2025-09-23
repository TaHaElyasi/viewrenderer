import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="w-full p-4 border border-base-300 rounded-xl" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="grid gap-3">
        <ng-container #contentHost></ng-container>
      </div>
      <div class="mt-3" *ngIf="submitLabel">
        <button type="submit" class="btn btn-primary">{{ submitLabel }}</button>
      </div>
    </form>
  `
})
export class FormComponent implements OnInit, OnChanges, OnDestroy, WidgetComponent {
  @Input() attrs?: Record<string, any>;
  @Output() submitted = new EventEmitter<any>();
  @Output() valueChange = new EventEmitter<any>();

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  public contentHost!: ViewContainerRef;

  form: FormGroup = new FormGroup({});
  submitLabel?: string;

  ngOnInit(): void {
    this.syncFromAttrs();
    this.valueChangesSub = this.form.valueChanges.subscribe(v => this.valueChange.emit(v));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attrs']) {
      this.syncFromAttrs();
    }
  }

  private valueChangesSub: any;

  ngOnDestroy(): void {
    if (this.valueChangesSub) {
      try { this.valueChangesSub.unsubscribe(); } catch {}
      this.valueChangesSub = undefined;
    }
  }

  private syncFromAttrs() {
    if (!this.attrs) return;
    if (typeof this.attrs['submitLabel'] === 'string') this.submitLabel = this.attrs['submitLabel'];
  }

  // API for children to register their controls
  registerControl(name: string, control: FormControl) {
    if (!name) return;
    if (this.form.contains(name)) {
      this.form.removeControl(name);
    }
    this.form.addControl(name, control);
  }

  get value() { return this.form.value; }

  onSubmit() {
    this.submitted.emit(this.form.getRawValue());
  }
}