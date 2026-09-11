const db = require("./database");
const QRCode = require("qrcode");

const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

function dbRun(query, params) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbAll(query, params) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function createInvoice(req, res) {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe غير مفعل" });
    }

    const { customer_name, customer_email, amount, description } = req.body;
    const user_id = req.session.user.id;

    if (!customer_name || !amount || !description) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "المبلغ يجب أن يكون أكبر من صفر" });
    }

    const invoice_number = `INV-${Date.now()}`;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "sar",
            product_data: {
              name: `فاتورة - ${customer_name}`,
              description: description
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }],
        mode: "payment",
        success_url: `${process.env.APP_URL || "http://localhost:3000"}/invoice/${invoice_number}?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/invoice/${invoice_number}?status=cancel`,
        customer_email: customer_email || undefined
      });

      await dbRun(
        `INSERT INTO invoices (
          user_id, invoice_number, customer_name, customer_email,
          amount, description, payment_url, stripe_session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, invoice_number, customer_name, customer_email, amount, description, session.url, session.id]
      );

      const qr = await QRCode.toDataURL(session.url);

      res.json({
        success: true,
        invoice_number,
        payment_url: session.url,
        qr_code: qr
      });
    } catch (stripeErr) {
      console.error("Stripe error:", stripeErr);
      res.status(500).json({ error: "خطأ في إنشاء جلسة الدفع" });
    }
  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
}

async function listInvoices(req, res) {
  try {
    const user_id = req.session.user.id;

    const invoices = await dbAll(
      `SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );

    res.json({ invoices });
  } catch (err) {
    console.error("List invoices error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
}

module.exports = { createInvoice, listInvoices };
