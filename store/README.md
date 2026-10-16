# متجر Cieloseta (منتج واحد)

صفحة منتج واحدة: بخاخ Cieloseta لمزيل رائحة الإبط بسعر 99 درهم.
زر **اشترِ الآن** يحوّل العميل مباشرة لصفحة Stripe Checkout (العنوان داخل الإمارات + رقم الجوال + الدفع).

## التشغيل

```bash
cd store
npm install
cp .env.example .env   # أضف STRIPE_SECRET_KEY
npm start
```

- السعر واسم المنتج في `server.js` (متغير `PRODUCT`).
- بعد الدفع يرجع العميل لصفحة `success.html`، وتلاقي الطلبات مع عناوين الشحن في لوحة Stripe → Payments.
