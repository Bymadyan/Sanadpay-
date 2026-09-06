const express = require("express");
const QRCode = require("qrcode");
const db = require("../db");
const { requireAuth } = require("../middleware");

const stripe = process.env.STRIPE_SECRET_KEY ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

const router = express.Router();

router.post("/create", requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe key غير مكون" });
    }

    const { customer_name, customer_email, amount, description } = req.body;
    const user_id = req.session.user.id;

    if (!customer_name || !amount || !description) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    const invoice_number = `INV-${Date.now()}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sar",
            product_data: {
              name: `فاتورة - ${customer_name}`,
              description: description
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${process.env.APP_URL || "http://localhost:3000"}/invoice/${invoice_number}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/invoice/${invoice_number}?status=cancel`,
      customer_email: customer_email
    });

    const stmt = db.prepare(`
      INSERT INTO invoices (
        user_id, invoice_number, customer_name, customer_email,
        amount, description, payment_url, stripe_session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      user_id,
      invoice_number,
      customer_name,
      customer_email,
      amount,
      description,
      session.url,
      session.id
    );

    const qr = await QRCode.toDataURL(session.url);

    res.json({
      success: true,
      invoice_number,
      payment_url: session.url,
      qr_code: qr
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في إنشاء الفاتورة" });
  }
});

router.get("/list", requireAuth, (req, res) => {
  const user_id = req.session.user.id;
  const invoices = db.prepare(`
    SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC
  `).all(user_id);

  res.json({ invoices });
});

router.get("/:invoiceNumber", (req, res) => {
  const { invoiceNumber } = req.params;
  const invoice = db.prepare("SELECT * FROM invoices WHERE invoice_number = ?").get(invoiceNumber);

  if (!invoice) {
    return res.status(404).render("404");
  }

  res.render("invoice-public", { invoice });
});

module.exports = router;
