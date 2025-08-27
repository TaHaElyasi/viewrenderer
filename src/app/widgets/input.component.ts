import { Component, Input, OnChanges, OnInit, Optional, Output, EventEmitter, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormComponent } from './form.component';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <label class="ui-field">
      <span class="ui-field-label">{{ label }}</span>
      <input class="ui-field-control" [type]="type" [placeholder]="placeholder" [formControl]="control" />
      <small class="ui-error" *ngIf="control.invalid && (control.dirty || control.touched)">{{ errorText }}</small>
    </label>
  `,
  styles: [`
    .ui-field { display: grid; gap: 6px; }
    .ui-field-label { font-size: 12px; color: #374151; }
    .ui-field-control { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .ui-error { color: #b91c1c; font-size: 12px; }
  `]
})
export class InputComponent implements OnInit, OnChanges, OnDestroy, WidgetComponent {
  @Input() attrs?: Record<string, any>;
  @Output() changed = new EventEmitter<{ name: string; value: any; source: 'input' }>();

  label: string = '';
  name: string = '';
  type: string = 'text';
  placeholder: string = '';
  required: boolean = false;
  minLength?: number;
  maxLength?: number;
  errorText: string = 'ورودی نامعتبر است';
  private initialValueSet = false;

  control = new FormControl<string | null>(null);
  private valueChangesSub?: any;

  constructor(@Optional() private form: FormComponent) {}

  ngOnInit(): void {
    this.syncFromAttrs();
    this.applyValidators();
    this.applyInitialValue();
    this.registerIfNeeded();
    this.subscribeToChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attrs']) {
      this.syncFromAttrs();
      this.applyValidators();
      this.applyInitialValue();
      this.registerIfNeeded(true);
    }
  }

  ngOnDestroy(): void {
    if (this.valueChangesSub?.unsubscribe) {
      try { this.valueChangesSub.unsubscribe(); } catch {}
    }
  }

  private syncFromAttrs() {
    const a = this.attrs || {};
    this.label = a['label'] ?? this.label;
    this.name = a['name'] ?? this.name;
    this.type = a['type'] ?? this.type;
    this.placeholder = a['placeholder'] ?? this.placeholder;
    this.required = a['required'] ?? this.required;
    this.minLength = a['minLength'] ?? a['min-length'] ?? this.minLength;
    this.maxLength = a['maxLength'] ?? a['max-length'] ?? this.maxLength;
    this.errorText = a['errorText'] ?? a['error-text'] ?? this.errorText;
  }

  private applyValidators() {
    const validators = [] as any[];
    if (this.required) validators.push(Validators.required);
    if (typeof this.minLength === 'number') validators.push(Validators.minLength(this.minLength));
    if (typeof this.maxLength === 'number') validators.push(Validators.maxLength(this.maxLength));
    this.control.setValidators(validators);
    this.control.updateValueAndValidity({ emitEvent: false });
  }

  private applyInitialValue() {
    if (this.initialValueSet) return;
    const a = this.attrs || {};
    const hasValue = Object.prototype.hasOwnProperty.call(a, 'value') || Object.prototype.hasOwnProperty.call(a, 'defaultValue') || Object.prototype.hasOwnProperty.call(a, 'default-value');
    if (hasValue) {
      const v = a['value'] ?? a['defaultValue'] ?? a['default-value'];
      this.control.setValue(v, { emitEvent: false });
      this.initialValueSet = true;
    }
  }

  private registerIfNeeded(reRegister: boolean = false) {
    if (!this.form || !this.name) return;
    this.form.registerControl(this.name, this.control);
  }

  private subscribeToChanges() {
    if (this.valueChangesSub?.unsubscribe) {
      try { this.valueChangesSub.unsubscribe(); } catch {}
    }
    this.valueChangesSub = this.control.valueChanges.subscribe(v => {
      this.changed.emit({ name: this.name, value: v, source: 'input' });
    });
  }
}