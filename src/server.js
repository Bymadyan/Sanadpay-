require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const authRoutes = require("./routes/auth");
const invoiceRoutes = require("./routes/invoices");
const paymentRoutes = require("./routes/payments");

const app = express();

// Trust proxy for Railway/load balancers
app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Custom Database-backed Session Store
const Store = require("express-session").Store;

class DbSessionStore extends Store {
  constructor() {
    super();
  }

  get(sid, callback) {
    try {
      console.log(`🔍 Session GET: ${sid}`);
      const sess = db.prepare("SELECT sess FROM sessions WHERE sid = ?").get(sid);
      if (!sess) {
        console.log(`❌ Session not found: ${sid}`);
        return callback(null, null);
      }
      const data = JSON.parse(sess.sess);
      console.log(`✅ Session found: ${sid}`, data.user ? `(user: ${data.user.email})` : '');
      callback(null, data);
    } catch (err) {
      console.error(`❌ Session GET error: ${err.message}`);
      callback(err);
    }
  }

  set(sid, sess, callback) {
    try {
      console.log(`💾 Session SET: ${sid}`, sess.user ? `(user: ${sess.user.email})` : '');
      const expire = (sess.cookie && sess.cookie.expires) ? sess.cookie.expires.getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000;
      const sessJson = JSON.stringify(sess);

      const existing = db.prepare("SELECT sid FROM sessions WHERE sid = ?").get(sid);
      if (existing) {
        db.prepare("UPDATE sessions SET sess = ?, expire = ? WHERE sid = ?").run(sessJson, expire, sid);
        console.log(`✅ Session updated: ${sid}`);
      } else {
        db.prepare("INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?)").run(sid, sessJson, expire);
        console.log(`✅ Session inserted: ${sid}`);
      }

      if (callback) callback(null);
    } catch (err) {
      console.error(`❌ Session SET error: ${err.message}`);
      if (callback) callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      console.log(`🗑️  Session DESTROY: ${sid}`);
      db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
      console.log(`✅ Session deleted: ${sid}`);
      if (callback) callback(null);
    } catch (err) {
      console.error(`❌ Session DESTROY error: ${err.message}`);
      if (callback) callback(err);
    }
  }

  clear(callback) {
    try {
      console.log(`🗑️  Session CLEAR: all`);
      db.prepare("DELETE FROM sessions").run();
      console.log(`✅ All sessions cleared`);
      if (callback) callback(null);
    } catch (err) {
      console.error(`❌ Session CLEAR error: ${err.message}`);
      if (callback) callback(err);
    }
  }

  length(callback) {
    try {
      const result = db.prepare("SELECT COUNT(*) as count FROM sessions").get();
      const count = result ? result.count : 0;
      callback(null, count);
    } catch (err) {
      callback(err);
    }
  }

  all(callback) {
    try {
      const sessions = db.prepare("SELECT * FROM sessions").all();
      callback(null, sessions);
    } catch (err) {
      callback(err);
    }
  }

  touch(sid, sess, callback) {
    try {
      const expire = (sess.cookie && sess.cookie.expires) ? sess.cookie.expires.getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000;
      db.prepare("UPDATE sessions SET expire = ? WHERE sid = ?").run(expire, sid);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

async function start() {
  try {
    console.log(`🚀 Starting SanadPay (NODE_ENV: ${process.env.NODE_ENV})`);

    // Initialize database first
    await db.initDb();
    console.log("✓ Database initialized");

    // Use database-backed session store
    const sessionStore = new DbSessionStore();
    app.use(session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "dev-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax"
      }
    }));

    // Make user available in templates
    app.use((req, res, next) => {
      res.locals.user = req.session.user || null;
      next();
    });

    // Diagnostic endpoint
    app.get("/api/debug/status", (req, res) => {
      const fs = require("fs");
      const path = require("path");
      const dataDir = path.join(__dirname, "..", "data");
      const dbPath = path.join(dataDir, "sanadpay.sqlite");

      let dbStats = null;
      if (fs.existsSync(dbPath)) {
        const stat = fs.statSync(dbPath);
        dbStats = {
          exists: true,
          size: stat.size,
          modified: stat.mtime
        };
      }

      const users = db.prepare("SELECT id, email, business_name, owner_name FROM users").all();

      res.json({
        status: "ok",
        node_env: process.env.NODE_ENV,
        session: req.session.user || null,
        database: {
          dbPath,
          dataDir,
          dataDirExists: fs.existsSync(dataDir),
          dbFile: dbStats,
          userCount: users.length,
          users
        }
      });
    });

    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/invoices", invoiceRoutes);
    app.use("/api/payments", paymentRoutes);

    // Page Routes
    app.get("/", (req, res) => {
      if (req.session.user) {
        return res.redirect("/dashboard");
      }
      res.render("landing");
    });

    app.get("/dashboard", (req, res) => {
      if (!req.session.user) {
        return res.redirect("/login");
      }
      res.render("dashboard");
    });

    app.get("/login", (req, res) => {
      if (req.session.user) {
        return res.redirect("/dashboard");
      }
      res.render("login");
    });

    app.get("/signup", (req, res) => {
      if (req.session.user) {
        return res.redirect("/dashboard");
      }
      res.render("signup");
    });

    app.get("/invoice/:invoiceNumber", (req, res) => {
      const { invoiceNumber } = req.params;
      const invoice = db.prepare("SELECT * FROM invoices WHERE invoice_number = ?").get(invoiceNumber);
      res.render("invoice-public", { invoice });
    });

    // 404
    app.use((req, res) => {
      res.status(404).render("404", { title: "Page Not Found" });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 SanadPay running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
