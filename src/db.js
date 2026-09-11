const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "sanadpay.sqlite");

let db = null;
let SQL = null;

const initDb = async () => {
  if (db) return;

  console.log(`📦 Initializing database at ${dbPath}`);

  const initSqlJs = require("sql.js");
  SQL = await initSqlJs();

  let data;
  if (fs.existsSync(dbPath)) {
    const stat = fs.statSync(dbPath);
    data = fs.readFileSync(dbPath);
    console.log(`✅ Loaded existing database (${stat.size} bytes)`);
  } else {
    console.log(`📝 Creating new database`);
  }

  db = new SQL.Database(data);

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      business_name TEXT,
      owner_name TEXT,
      phone TEXT,
      stripe_account_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      invoice_number TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      description TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SAR',
      status TEXT NOT NULL DEFAULT 'pending',
      payment_url TEXT,
      stripe_session_id TEXT UNIQUE,
      payment_received_at INTEGER,
      pdf_generated_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      stripe_session_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      paid_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire INTEGER NOT NULL
    );
  `);

  saveDb();
};

const saveDb = () => {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
      const stat = fs.statSync(dbPath);
      console.log(`✓ Database saved to ${dbPath} (${stat.size} bytes)`);
    } catch (err) {
      console.error("❌ Error saving database:", err.message);
      console.error("Path:", dbPath);
      console.error("DataDir exists:", fs.existsSync(dataDir));
    }
  }
};

const dbWrapper = {
  prepare: (sql) => ({
    run: (...params) => {
      if (!db) throw new Error("Database not initialized");
      const stmt = db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
      saveDb();

      let id = null;
      try {
        const lastIdStmt = db.prepare("SELECT last_insert_rowid() as id");
        if (lastIdStmt.step()) {
          id = lastIdStmt.getAsObject().id;
        }
        lastIdStmt.free();
      } catch (e) {
        console.error("Error getting last insert id:", e);
      }

      return {
        changes: 1,
        lastInsertRowid: id
      };
    },
    get: (...params) => {
      if (!db) throw new Error("Database not initialized");
      const stmt = db.prepare(sql);
      stmt.bind(params);
      let result;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    },
    all: (...params) => {
      if (!db) throw new Error("Database not initialized");
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }
  }),
  exec: (sql) => {
    if (!db) throw new Error("Database not initialized");
    db.run(sql);
    saveDb();
  }
};

module.exports = dbWrapper;
module.exports.initDb = initDb;
