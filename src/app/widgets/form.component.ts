import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="ui-form" [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="ui-form-fields">
        <ng-container #contentHost></ng-container>
      </div>
      <div class="ui-form-actions" *ngIf="submitLabel">
        <button type="submit" class="ui-button">{{ submitLabel }}</button>
      </div>
    </form>
  `,
  styles: [`
    .ui-form { display: block; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .ui-form-fields { display: grid; gap: 12px; }
    .ui-form-actions { margin-top: 12px; }
    .ui-button { background: #4f46e5; color: white; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }
  `]
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