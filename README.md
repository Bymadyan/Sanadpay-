# SanadPay v2

منصة دفع فواتير احترافية وآمنة

## البدء السريع

### المتطلبات
- Node.js >= 18
- npm

### التثبيت

```bash
npm install
```

### إعداد متغيرات البيئة

```bash
cp .env.example .env
```

ثم عدّل `.env` وأضف مفاتيح Stripe الخاصة بك:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### التشغيل

**للتطوير:**
```bash
npm run dev
```

**للإنتاج:**
```bash
npm start
```

سيعمل التطبيق على `http://localhost:3000`

## الميزات

✅ التسجيل وتسجيل الدخول الآمن
✅ إنشاء وإدارة الفواتير
✅ دفع آمن عبر Stripe
✅ رمز QR لسهولة المشاركة
✅ واجهة احترافية وسهلة الاستخدام
✅ دعم اللغة العربية

## الهيكل

```
sanadpay-v2/
├── public/           # الملفات الثابتة (HTML, CSS)
├── database.js       # إعدادات قاعدة البيانات
├── auth.js          # منطق المصادقة
├── invoices.js      # منطق الفواتير
├── server.js        # الخادم الرئيسي
└── package.json     # المكتبات
```

## الترخيص

جميع الحقوق محفوظة
