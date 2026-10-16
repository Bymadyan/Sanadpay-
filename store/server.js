require("dotenv").config();
const express = require("express");
const path = require("path");

const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

const app = express();
const PORT = process.env.PORT || 3000;

// The single product sold by this store
const PRODUCT = {
  name: "Cieloseta Underarm Odor Control Mist - 100ml",
  description: "بخاخ مزيل رائحة الإبط - جليكوليك أسيد 7% - بدون عطر",
  price: 99, // AED
  currency: "aed",
  image: "/images/product.jpg"
};

app.set("trust proxy", 1);
app.use(express.static(path.join(__dirname, "public")));

function baseUrl(req) {
  return process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
}

// Buy button → Stripe Checkout page (shipping address + payment)
app.post("/checkout", async (req, res) => {
  if (!stripe) {
    return res.status(500).send("الدفع غير مفعّل: أضف STRIPE_SECRET_KEY في متغيرات البيئة");
  }

  try {
    const url = baseUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "ar",
      line_items: [{
        price_data: {
          currency: PRODUCT.currency,
          product_data: {
            name: PRODUCT.name,
            description: PRODUCT.description,
            images: [url + PRODUCT.image]
          },
          unit_amount: PRODUCT.price * 100
        },
        quantity: 1,
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 }
      }],
      shipping_address_collection: { allowed_countries: ["AE"] },
      phone_number_collection: { enabled: true },
      success_url: `${url}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url}/`
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).send("حدث خطأ أثناء إنشاء صفحة الدفع، حاول مرة أخرى");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Store running on http://localhost:${PORT}`);
});
