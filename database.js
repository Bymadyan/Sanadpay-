const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(path.join(dataDir, "app.db"), (err) => {
  if (err) console.error("Database connection error:", err);
  else console.log("✅ Database connected");
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      business_name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      phone TEXT,
      stripe_account_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SAR',
      status TEXT NOT NULL DEFAULT 'pending',
      payment_url TEXT,
      stripe_session_id TEXT UNIQUE,
      payment_received_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      stripe_session_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      paid_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )
  `);

  db.run("CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)");
  db.run("CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id)");
});

module.exports = db;
