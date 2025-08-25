import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ViewRendererComponent } from './view-renderer/view-renderer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, ViewRendererComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'viewrenderer';

  xml: string = `
<card title="نمونه کارت">
  <label text="سلام! به رندرر ویو خوش آمدید" color="#334155"></label>
  <button label="کلیک کن" color="#16a34a"></button>
</card>`;

  exampleSimple: string = `
<label text="یک لیبل ساده" color="#0ea5e9"></label>
<button label="تایید" color="#6366f1"></button>`;

  exampleCard: string = `
<card title="اطلاعات کاربر">
  <label text="نام: علی رضایی" color="#111827"></label>
  <label text="سن: ۲۸"></label>
  <button label="ویرایش" color="#f59e0b"></button>
</card>`;

  exampleTabs: string = `
<tabs>
  <tab label="نمای کلی">
    <card title="داشبورد">
      <label text="سلام دنیا" color="#334155"></label>
    </card>
  </tab>
  <tab label="تنظیمات">
    <card title="ترجیحات">
      <label text="حالت تاریک: خاموش"></label>
      <button label="تغییر" color="#ef4444"></button>
    </card>
  </tab>
</tabs>`;

  exampleComplex: string = `
<card title="صفحه اصلی">
  <tabs activeIndex="1">
    <tab label="خانه">
      <label text="خوش آمدید" color="#0ea5e9"></label>
      <card title="وضعیت">
        <label text="سرورها: ۳ آنلاین"></label>
        <button label="به‌روزرسانی" color="#10b981"></button>
      </card>
    </tab>
    <tab label="گزارشات">
      <tabs>
        <tab label="روزانه">
          <card title="گزارش امروز">
            <label text="بازدید: ۱۲۳۴"></label>
          </card>
        </tab>
        <tab label="ماهانه">
          <card title="گزارش ماه">
            <label text="خریدها: ۵۴"></label>
            <button label="جزئیات" color="#6366f1"></button>
          </card>
        </tab>
      </tabs>
    </tab>
    <tab label="تنظیمات">
      <card title="امنیت">
        <label text="وضعیت: خوب" color="#22c55e"></label>
      </card>
      <card title="اعلان‌ها">
        <label text="ایمیل: فعال"></label>
        <label text="SMS: غیرفعال"></label>
      </card>
    </tab>
  </tabs>
</card>`;
}
