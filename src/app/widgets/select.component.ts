import { Component, Input, OnChanges, OnInit, Optional, Output, EventEmitter, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormComponent } from './form.component';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <label class="ui-field">
      <span class="ui-field-label">{{ label }}</span>
      <select class="ui-field-control" [formControl]="control">
        <option *ngFor="let opt of options" [value]="opt.value">{{ opt.label }}</option>
      </select>
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
export class SelectComponent implements OnInit, OnChanges, OnDestroy, WidgetComponent {
  @Input() attrs?: Record<string, any>;
  @Output() changed = new EventEmitter<{ name: string; value: any; source: 'select' }>();

  label: string = '';
  name: string = '';
  required: boolean = false;
  errorText: string = 'انتخاب نامعتبر است';
  options: { label: string, value: string }[] = [];
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
    this.required = a['required'] ?? this.required;
    this.errorText = a['errorText'] ?? a['error-text'] ?? this.errorText;
    // options can be provided as JSON string or CSV label:value|label:value
    const opts = a['options'] ?? '';
    if (Array.isArray(opts)) {
      this.options = opts as any;
    } else if (typeof opts === 'string') {
      try {
        if (opts.trim().startsWith('[')) {
          this.options = JSON.parse(opts);
        } else {
          this.options = opts.split('|').map((p: string) => {
            const [label, value] = p.split(':');
            return { label: label?.trim() ?? '', value: (value ?? label)?.trim() ?? '' };
          });
        }
      } catch {
        this.options = [];
      }
    }
  }

  private applyValidators() {
    const validators = [] as any[];
    if (this.required) validators.push(Validators.required);
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
      this.changed.emit({ name: this.name, value: v, source: 'select' });
    });
  }
}