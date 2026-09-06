# SanadPay - منصة الفواتير الاحترافية

منصة ويب حديثة لإنشاء فواتير احترافية وتوليد روابط دفع وQR codes بسهولة.

## ✨ الميزات

- 📝 **إنشاء فواتير** - بيانات بسيطة وسريعة
- 🔗 **رابط دفع فوري** - روابط Stripe آمنة
- 🔲 **QR Codes** - مشاركة سهلة مع العملاء
- 📄 **PDF تلقائي** - فاتورة PDF بعد الدفع
- 🌙 **واجهة احترافية** - Dark theme عصري
- 🇸🇦 **RTL عربي** - دعم كامل للعربية

## 🚀 البدء السريع

### المتطلبات
- Node.js >= 18
- npm أو yarn

### التثبيت

```bash
npm install
cp .env.example .env
```

### إعدادات البيئة

عدّل `.env` وأضف:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### التشغيل

```bash
# Development
npm run dev

# Production
npm start
```

موقعك سيكون متاح على: http://localhost:3000

## 📦 المشروع

```
src/
├── server.js          # Express app
├── db.js              # SQLite database
├── middleware.js      # Auth middleware
├── routes/
│   ├── auth.js       # Sign up, login, logout
│   ├── invoices.js   # Create, list invoices
│   └── payments.js   # Stripe webhook, PDF
├── views/            # EJS templates
└── public/           # CSS, assets
```

## 🏗️ البنية

### Users
- التسجيل والدخول
- حفظ بيانات المشروع/الشركة

### Invoices
- إنشاء فاتورة بـ: اسم العميل، المبلغ، الوصف
- توليد رابط دفع Stripe
- توليد QR code
- تتبع حالة الدفع

### Payments
- Webhook لـ Stripe
- توليد PDF بعد الدفع
- حفظ الفاتورة كـ PDF

## 🎨 التصميم

- Dark theme احترافي
- Responsive design
- Arabic RTL support
- Modern gradients

## 🔒 الأمان

- Bcrypt لـ passwords
- Session-based auth
- Secure cookies
- Environment variables

## 📱 المنصات

- ✅ Desktop
- ✅ Mobile
- ✅ Tablet

## 🚀 Deployment

### Railway

1. اربط الـ repository
2. أضف environment variables
3. Deploy

```bash
git push origin main
```

Railway سيبني ويشتغل تلقائياً.

## 📝 الترخيص

جميع الحقوق محفوظة © 2024
