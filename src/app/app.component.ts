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

  exampleLazy: string = `
<card title="بالای صفحه (غیر لِیزی)">
  <label text="این بخش بلافاصله رندر می‌شود" color="#111827"></label>
</card>

<!-- فیلر زیاد برای اسکرول طولانی قبل از اولین ویجت لِیزی -->
<card title="فهرست طولانی ۱">
  <label text="آیتم ۱"></label>
  <label text="آیتم ۲"></label>
  <label text="آیتم ۳"></label>
  <label text="آیتم ۴"></label>
  <label text="آیتم ۵"></label>
  <label text="آیتم ۶"></label>
  <label text="آیتم ۷"></label>
  <label text="آیتم ۸"></label>
  <label text="آیتم ۹"></label>
  <label text="آیتم ۱۰"></label>
  <label text="آیتم ۱۱"></label>
  <label text="آیتم ۱۲"></label>
  <label text="آیتم ۱۳"></label>
  <label text="آیتم ۱۴"></label>
  <label text="آیتم ۱۵"></label>
  <label text="آیتم ۱۶"></label>
  <label text="آیتم ۱۷"></label>
  <label text="آیتم ۱۸"></label>
  <label text="آیتم ۱۹"></label>
  <label text="آیتم ۲۰"></label>
  <label text="آیتم ۲۱"></label>
  <label text="آیتم ۲۲"></label>
  <label text="آیتم ۲۳"></label>
  <label text="آیتم ۲۴"></label>
  <label text="آیتم ۲۵"></label>
  <label text="آیتم ۲۶"></label>
  <label text="آیتم ۲۷"></label>
  <label text="آیتم ۲۸"></label>
  <label text="آیتم ۲۹"></label>
  <label text="آیتم ۳۰"></label>
  <label text="آیتم ۳۱"></label>
  <label text="آیتم ۳۲"></label>
  <label text="آیتم ۳۳"></label>
  <label text="آیتم ۳۴"></label>
  <label text="آیتم ۳۵"></label>
  <label text="آیتم ۳۶"></label>
  <label text="آیتم ۳۷"></label>
  <label text="آیتم ۳۸"></label>
  <label text="آیتم ۳۹"></label>
  <label text="آیتم ۴۰"></label>
  <label text="آیتم ۴۱"></label>
  <label text="آیتم ۴۲"></label>
  <label text="آیتم ۴۳"></label>
  <label text="آیتم ۴۴"></label>
  <label text="آیتم ۴۵"></label>
  <label text="آیتم ۴۶"></label>
  <label text="آیتم ۴۷"></label>
  <label text="آیتم ۴۸"></label>
  <label text="آیتم ۴۹"></label>
  <label text="آیتم ۵۰"></label>
</card>

<!-- اولین ویجت لِیزی: کارت -->
<card title="کارت لِیزی ۱" lazy="true">
  <label text="این کارت تنها وقتی داخل ویوپورت بیاید و ۲ ثانیه بعد نمایش داده می‌شود" color="#0ea5e9"></label>
  <button label="اکشن کارت" color="#10b981"></button>
</card>

<!-- فیلر زیاد برای اسکرول طولانی بین ویجت‌های لِیزی -->
<card title="فهرست طولانی ۲">
  <label text="آیتم ۵۱"></label>
  <label text="آیتم ۵۲"></label>
  <label text="آیتم ۵۳"></label>
  <label text="آیتم ۵۴"></label>
  <label text="آیتم ۵۵"></label>
  <label text="آیتم ۵۶"></label>
  <label text="آیتم ۵۷"></label>
  <label text="آیتم ۵۸"></label>
  <label text="آیتم ۵۹"></label>
  <label text="آیتم ۶۰"></label>
  <label text="آیتم ۶۱"></label>
  <label text="آیتم ۶۲"></label>
  <label text="آیتم ۶۳"></label>
  <label text="آیتم ۶۴"></label>
  <label text="آیتم ۶۵"></label>
  <label text="آیتم ۶۶"></label>
  <label text="آیتم ۶۷"></label>
  <label text="آیتم ۶۸"></label>
  <label text="آیتم ۶۹"></label>
  <label text="آیتم ۷۰"></label>
  <label text="آیتم ۷۱"></label>
  <label text="آیتم ۷۲"></label>
  <label text="آیتم ۷۳"></label>
  <label text="آیتم ۷۴"></label>
  <label text="آیتم ۷۵"></label>
  <label text="آیتم ۷۶"></label>
  <label text="آیتم ۷۷"></label>
  <label text="آیتم ۷۸"></label>
  <label text="آیتم ۷۹"></label>
  <label text="آیتم ۸۰"></label>
</card>

<!-- دومین ویجت لِیزی: تب‌ها (اتمیک) -->
<tabs lazy="true">
  <tab label="تب ۱">
    <label text="محتوای تب ۱"></label>
  </tab>
  <tab label="تب ۲">
    <card title="کارت داخل تب">
      <label text="این هم بعد از ورود تب‌ها به ویوپورت و با تاخیر ۲ ثانیه‌ای رندر می‌شود"></label>
    </card>
  </tab>
  <tab label="تب ۳">
    <card title="کارت دوم داخل تب">
      <label text="لِیزی رندر به‌خوبی با ویجت‌های تو در تو کار می‌کند"></label>
      <button label="تست" color="#6366f1"></button>
    </card>
  </tab>
</tabs>

<!-- فیلر نهایی برای اسکرول بیشتر و یک ویجت لِیزی دیگر در انتها -->
<card title="فهرست طولانی ۳">
  <label text="آیتم ۸۱"></label>
  <label text="آیتم ۸۲"></label>
  <label text="آیتم ۸۳"></label>
  <label text="آیتم ۸۴"></label>
  <label text="آیتم ۸۵"></label>
  <label text="آیتم ۸۶"></label>
  <label text="آیتم ۸۷"></label>
  <label text="آیتم ۸۸"></label>
  <label text="آیتم ۸۹"></label>
  <label text="آیتم ۹۰"></label>
  <label text="آیتم ۹۱"></label>
  <label text="آیتم ۹۲"></label>
  <label text="آیتم ۹۳"></label>
  <label text="آیتم ۹۴"></label>
  <label text="آیتم ۹۵"></label>
  <label text="آیتم ۹۶"></label>
  <label text="آیتم ۹۷"></label>
  <label text="آیتم ۹۸"></label>
  <label text="آیتم ۹۹"></label>
  <label text="آیتم ۱۰۰"></label>
</card>

<!-- سومین ویجت لِیزی: کارت پایین صفحه -->
<card title="کارت لِیزی ۲ (پایین صفحه)" lazy="true">
  <label text="این کارت باید فقط بعد از اسکرول طولانی و ۲ ثانیه تاخیر ظاهر شود" color="#ef4444"></label>
</card>`;
exampleHttp: string = `<card title="داده‌ها از وب‌سرویس">
  <tabs>
    <tab label="کاربران">
      <card title="لیست کاربران (JSONPlaceholder)">
        <table url="https://jsonplaceholder.typicode.com/users" columns="name,email,company.name"></table>
      </card>
    </tab>
    <tab label="توضیحات">
      <card title="درباره">
        <label text="این تب شامل یک جدول است که داده‌ها را با HttpClient از یک وب‌سرویس عمومی می‌خواند."></label>
      </card>
    </tab>
  </tabs>
</card>` 
}



