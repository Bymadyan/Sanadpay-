const express = require("express");
const PDFDocument = require("pdfkit");
const db = require("../db");

const stripe = process.env.STRIPE_SECRET_KEY ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send("Stripe not configured");
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoice = db.prepare(
      "SELECT * FROM invoices WHERE stripe_session_id = ?"
    ).get(session.id);

    if (invoice) {
      db.prepare(`
        UPDATE invoices SET status = 'paid', payment_received_at = ?
        WHERE id = ?
      `).run(Math.floor(Date.now() / 1000), invoice.id);
    }
  }

  res.json({ received: true });
});

router.get("/invoice/:invoiceNumber/pdf", (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const invoice = db.prepare(
      "SELECT i.*, u.business_name, u.owner_name FROM invoices i JOIN users u ON i.user_id = u.id WHERE i.invoice_number = ?"
    ).get(invoiceNumber);

    if (!invoice) {
      return res.status(404).send("الفاتورة غير موجودة");
    }

    const doc = new PDFDocument({ bufferPages: true, lang: "ar" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoiceNumber}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text("فاتورة", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`رقم الفاتورة: ${invoice.invoice_number}`);
    doc.text(`التاريخ: ${new Date(invoice.created_at * 1000).toLocaleDateString('ar-SA')}`);
    doc.moveDown();

    doc.fontSize(14).text("من:", { underline: true });
    doc.fontSize(11).text(`الشركة: ${invoice.business_name}`);
    doc.text(`المالك: ${invoice.owner_name}`);
    doc.moveDown();

    doc.fontSize(14).text("إلى:", { underline: true });
    doc.fontSize(11).text(`الاسم: ${invoice.customer_name}`);
    if (invoice.customer_email) doc.text(`البريد: ${invoice.customer_email}`);
    if (invoice.customer_phone) doc.text(`الهاتف: ${invoice.customer_phone}`);
    doc.moveDown();

    doc.fontSize(14).text("التفاصيل:", { underline: true });
    doc.fontSize(11).text(invoice.description);
    doc.moveDown();

    doc.fontSize(16).text(`المبلغ: ${invoice.amount} ريال`, { bold: true });
    doc.fontSize(11).text(`الحالة: ${invoice.status === 'paid' ? 'مدفوعة' : 'قيد الانتظار'}`);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("خطأ في إنشاء PDF");
  }
});

module.exports = router;
