import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { WidgetComponent } from '../interfaces/widget.interface';

@Component({
  selector: 'ui-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-data-table">
      <div class="header">
        <div class="title">{{ attrs?.['title'] || title || 'Data Table' }}</div>
        <div class="actions">
          <button class="refresh" (click)="fetchIfPossible()" [disabled]="loading">{{ loading ? 'در حال بارگذاری...' : 'بروزرسانی' }}</button>
        </div>
      </div>

      <div *ngIf="error" class="error">{{ error }}</div>

      <table *ngIf="!error" class="table">
        <thead>
          <tr>
            <th *ngFor="let col of displayColumns">{{ columnLabel(col) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of data">
            <td *ngFor="let col of displayColumns">{{ resolveCell(row, col) }}</td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!loading && !error && (!data || data.length === 0)" class="empty">داده‌ای برای نمایش موجود نیست</div>
    </div>
  `,
  styles: [`
    .ui-data-table { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .title { font-weight: 600; color: #111827; }
    .actions { display: flex; gap: 8px; }
    .refresh { background: #6366f1; color: white; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .refresh:disabled { opacity: 0.6; cursor: default; }
    .table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    thead th { background: #eef2ff; color: #3730a3; }
    tbody tr:hover { background: #fafafa; }
    .error { color: #b91c1c; padding: 12px; }
    .empty { padding: 12px; color: #6b7280; }
  `]
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
    this.fetchIfPossible();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attrs'] || changes['url'] || changes['columns']) {
      this.syncFromInputs();
      this.fetchIfPossible();
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

  fetchIfPossible(): void {
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