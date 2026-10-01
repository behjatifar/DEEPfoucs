# 🎯 Deep Focus & Productivity Dashboard | داشبورد تمرکز عمیق و بهره‌وری

A modern, minimalist, and functional web-based productivity application designed for deep work sessions[cite: 1]. Built with pure Vanilla JavaScript (ES6+), HTML5, and CSS3 with **zero external dependencies**[cite: 1].

یک وب‌اپلیکیشن مدرن، مینیمال و کاربردی برای مدیریت جلسات کار عمیق (Deep Work) که با جاوااسکریپت خام (Vanilla JS)، معماری تابعی (Functional Programming) و بدون هیچ کتابخانه خارجی توسعه داده شده است[cite: 1].

---

## ✨ Key Features | ویژگی‌های کلیدی

### 🇮🇷 امکانات (فارسی)
* **طراحی مدرن گرادیانت دارک (Gemini-Inspired UI):** پس‌زمینه مات تاریک (`#0a0a0a` / `#121212`) همراه با افکت نوری پویا به رنگ‌های بنفش و آبی و پنل‌های شیشه‌ای (Glassmorphism)[cite: 1].
* **تایمر پومودورو دایره‌ای (Work / Rest):** تایمر قابل تنظیم توسط کاربر برای زمان کار و استراحت با تغییر خودکار وضعیت[cite: 1].
* **هشدارهای صوتی و بصری هوشمند:** پخش صدای ملایم با استفاده از Web Audio API و تغییر تم نوری پس‌زمینه هنگام جابه‌جایی بین حالت کار و استراحت[cite: 1].
* **آمار روزانه و تقویم دوزبانه:** نمایش تعداد پومودوروهای تکمیل‌شده در روز[cite: 1] به همراه نمایش تاریخ **شمسی** و **میلادی** زیر وضعیت تایمر.
* **مدیریت پیشرفته تسک‌ها (Works):**
  * **مرتب‌سازی هوشمند (Auto-Sorting):** قرارگیری خودکار کارهای انجام‌نشده در بالای لیست و انتقال کارهای انجام‌شده به انتهای لیست بر اساس زمان تکمیل.
  * **اولویت‌بندی با Drag & Drop:** امکان جابه‌جایی و تعیین اولویت تسک‌ها با کشیدن و رها کردن.
* **تخلیه ذهنی (Thoughts & Brain Dump):** بخش مجزا در پایین صفحه برای ثبت سریع افکار ناگهانی بدون برهم خوردن تمرکز، با قابلیت تبدیل یک‌کلیکی هر فکر به تسک کاری[cite: 1].
* **حالت محرمانگی و اسکرین‌شات (Spoiler Mode):** امکان تار کردن (Blur) تکی یا کلی تسک‌ها و افکار (`Spoiler All`) برای حفظ حریم خصوصی هنگام گرفتن اسکرین‌شات.
* **سطل زباله و آرشیو (Recycle Bin):** انتقال تسک‌ها و افکار حذف‌شده به سطل زباله با قابلیت بازیابی (Restore) به لیست اصلی یا حذف دائمی.
* **خروجی تصویر گزارش کار روزانه (PNG Report Exporter):** تولید و دانلود کارت گرافیکی باکیفیت از آمار پومودوروها و تسک‌های انجام‌شده روزانه با استفاده از HTML5 Canvas API (مناسب برای اشتراک‌گذاری در شبکه‌های اجتماعی).
* **ذخیره‌‌سازی محلی پایدار (`LocalStorage`):** ذخیره خودکار تمام تسک‌ها، افکار، آرشیوها، آمار روزانه و تنظیمات تایمر در مرورگر بدون پاک شدن با رفرش صفحه[cite: 1].

---

### 🌐 Features (English)
* **Modern Dark Ambient Aesthetic:** Deep matte dark tones (`#0a0a0a` / `#121212`) paired with dynamic purple and electric blue ambient glows and glassmorphism panels[cite: 1].
* **Configurable Pomodoro State Machine:** Circular countdown timer supporting seamless Work and Rest cycle transitions[cite: 1].
* **Audio & Visual Cues:** Soft notification chime powered by the native Web Audio API and ambient background color shifts during rest sessions[cite: 1].
* **Daily Pomodoro Stats & Dual Calendar:** Tracks completed daily focus sessions[cite: 1] and displays both **Persian (Shamsi)** and **Gregorian** dates natively using `Intl.DateTimeFormat`.
* **Smart Task Management (`Works`):**
  * **Drag & Drop Priority Ordering:** Reorder tasks effortlessly using the native HTML5 Drag and Drop API.
  * **Completion Auto-Sorting:** Keeps undone tasks at the top and automatically pushes completed tasks to the bottom ordered by completion timestamp.
* **Brain Dump (`Thoughts`):** Quickly capture distracting thoughts during deep work and convert them into actionable tasks with a single click[cite: 1].
* **Privacy Spoiler Mode:** Blur individual items or toggle master `Spoiler All` controls before taking screenshots.
* **Recycle Bin (Soft Delete & Restore):** Safely archives deleted tasks and thoughts with origin badges, allowing 1-click restoration or permanent deletion.
* **Native Canvas Daily Report Exporter:** Generates and downloads a high-DPI PNG summary card of daily completed works and Pomodoro counts—respecting active spoiler masks.
* **Local Storage Persistence:** Automatically serializes and saves all state changes in `localStorage`[cite: 1].

---

## 🛠️ Technical Architecture | معماری فنی

* **Tech Stack:** HTML5, CSS3 (CSS Variables, Flexbox, Conic Gradients, Backdrop Filters), Vanilla JavaScript (ES6+)[cite: 1].
* **Functional Programming & Clean Code:** Built with pure state-transformation functions, immutable state updates, DRY collection renderers, and comprehensive English code comments[cite: 1].
* **Modular Design:** Rules, configurations, storage handlers, timer logic, and canvas rendering are cleanly separated across isolated modules[cite: 1].

---

## 📂 File Structure | ساختار فایل‌ها

```text
├── index.html      # Main application layout, timer, lists, and Recycle Bin modal
├── style.css       # Gemini-inspired dark gradient theme, glassmorphism, and animations
├── storage.js      # Safe LocalStorage wrapper with JSON serialization and fallback handling
├── timer.js        # Functional Pomodoro countdown engine and Web Audio API synthesizer
├── exporter.js     # HTML5 Canvas engine for generating downloadable PNG daily reports
├── app.js          # Main functional controller, state reducers, drag-and-drop, and DOM bindings
└── Deep Foucs.md   # Project architecture and specification document
```

---

## 🚀 Getting Started | نحوه اجرا

نیازی به نصب هیچ پکیج یا راه‌اندازی سرور محلی (Local Server) نیست:

1. مخزن (Repository) را کلون یا دانلود کنید:
   ```bash
   git clone https://github.com/your-username/deep-focus-dashboard.git
   ```
2. وارد پوشه پروژه شوید:
   ```bash
   cd deep-focus-dashboard
   ```
3. فایل `index.html` را مستقیماً در مرورگر خود باز کنید.

---

## ⚙️ Customization | شخصی‌سازی قوانین

تمامی قوانین و تنظیمات پیش‌فرض در ابتدای فایل‌های `app.js` و `exporter.js` به صورت ماژولار قرار گرفته‌اند[cite: 1]:
* تغییر زمان پیش‌فرض کار و استراحت از طریق `DEFAULT_STATE.timerSettings` در `app.js`.
* فعال یا غیرفعال کردن قابلیت مرتب‌سازی خودکار (`autoSortCompleted`) و درگ‌اند‌دراپ (`isSortable`) برای هر لیست در آبجکت `DOM.collections` داخل `app.js`.
* تغییر ابعاد و رنگ‌بندی کارت گزارش روزانه در آبجکت `CONFIG` داخل فایل `exporter.js`.

---

## 📄 License
This project is open-source and available under the **MIT License**.