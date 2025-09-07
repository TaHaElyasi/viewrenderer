import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border border-base-300 rounded-xl shadow-sm overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 bg-base-200 border-b border-base-300">
        <div class="font-semibold text-base-content">{{ attrs?.['title'] || title || 'Data Table' }}</div>
        <div class="flex gap-2">
          <button class="btn btn-primary btn-sm" (click)="contextRefreshPossible()" [disabled]="loading">{{ loading ? 'در حال بارگذاری...' : 'بروزرسانی' }}</button>
        </div>
      </div>

      <div *ngIf="error" class="text-error px-4 py-3">{{ error }}</div>

      <div class="overflow-x-auto">
        <table *ngIf="!error" class="table w-full">
          <thead>
            <tr>
              <th *ngFor="let col of displayColumns" class="bg-base-200 text-base-content">{{ columnLabel(col) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of data" class="hover">
              <td *ngFor="let col of displayColumns">{{ resolveCell(row, col) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="!loading && !error && (!data || data.length === 0)" class="px-4 py-3 text-base-content/60">داده‌ای برای نمایش موجود نیست</div>
    </div>
  `
})
export class TableComponent implements OnInit, OnChanges, WidgetComponent {
  @Input() url?: string;
  @Input() columns?: string | string[];
  @Input() title?: string;
  @Input() attrs?: Record<string, any>;

  data: any[] = [];
  loading = false;
  error?: string;
  displayColumns: string[] = [];

  private http = inject(HttpClient);

  ngOnInit(): void {
    this.syncFromInputs();
    this.contextRefreshPossible();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attrs'] || changes['url'] || changes['columns']) {
      this.syncFromInputs();
      this.contextRefreshPossible();
    }
  }

  private syncFromInputs(): void {
    if (!this.url && this.attrs && typeof this.attrs['url'] === 'string') {
      this.url = this.attrs['url'];
    }
    if (!this.title && this.attrs && typeof this.attrs['title'] === 'string') {
      this.title = this.attrs['title'];
    }

    const cols = (this.columns ?? this.attrs?.['columns']);
    if (Array.isArray(cols)) {
      this.displayColumns = cols.map(String);
    } else if (typeof cols === 'string') {
      this.displayColumns = cols.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  contextRefreshPossible(): void {
    if (!this.url) return;
    this.loading = true;
    this.error = undefined;
    this.http.get<any>(this.url).subscribe({
      next: (res) => {
        const arr = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        this.data = arr;
        if (!this.displayColumns.length && this.data.length) {
          this.displayColumns = Object.keys(this.data[0]).slice(0, 5);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || 'خطا در دریافت داده';
        this.loading = false;
      }
    });
  }

  columnLabel(col: string): string {
    const labels = this.attrs?.['columnLabels'] as Record<string, string> | undefined;
    return (labels && labels[col]) || col;
  }

  resolveCell(row: any, path: string): any {
    // Support nested props like company.name
    return path.split('.').reduce((acc: any, key: string) => (acc ? acc[key] : undefined), row);
  }
}