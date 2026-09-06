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
      return res.status(404).send("Invoice not found");
    }

    const doc = new PDFDocument({ bufferPages: true, lang: "ar" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoiceNumber}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #: ${invoice.invoice_number}`);
    doc.text(`Date: ${new Date(invoice.created_at * 1000).toLocaleDateString('en-US')}`);
    doc.moveDown();

    doc.fontSize(14).text("FROM:", { underline: true });
    doc.fontSize(11).text(`Business: ${invoice.business_name}`);
    doc.text(`Owner: ${invoice.owner_name}`);
    doc.moveDown();

    doc.fontSize(14).text("TO:", { underline: true });
    doc.fontSize(11).text(`Name: ${invoice.customer_name}`);
    if (invoice.customer_email) doc.text(`Email: ${invoice.customer_email}`);
    if (invoice.customer_phone) doc.text(`Phone: ${invoice.customer_phone}`);
    doc.moveDown();

    doc.fontSize(14).text("DESCRIPTION:", { underline: true });
    doc.fontSize(11).text(invoice.description);
    doc.moveDown();

    doc.fontSize(16).text(`Amount: ${invoice.amount} SAR`, { bold: true });
    doc.fontSize(11).text(`Status: ${invoice.status === 'paid' ? 'Paid' : 'Pending'}`);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
});

module.exports = router;
