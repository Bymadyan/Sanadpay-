require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./db");

// Force rebuild trigger - 2026-09-10T23:45:00Z

const authRoutes = require("./routes/auth");
const invoiceRoutes = require("./routes/invoices");
const paymentRoutes = require("./routes/payments");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Initialize database first
    await db.initDb();
    console.log("✓ Database initialized");

    // Database-backed session store using SQLite
    const sessionStore = {
      get(sid, callback) {
        try {
          const row = db.prepare("SELECT sess FROM sessions WHERE sid = ? AND expire > ?").get(sid, Math.floor(Date.now() / 1000));
          if (row) {
            const sess = JSON.parse(row.sess);
            callback(null, sess);
          } else {
            callback(null, null);
          }
        } catch (err) {
          callback(err);
        }
      },
      set(sid, sess, callback) {
        try {
          const expire = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
          const sessJson = JSON.stringify(sess);

          // Check if session exists
          const existing = db.prepare("SELECT sid FROM sessions WHERE sid = ?").get(sid);
          if (existing) {
            db.prepare("UPDATE sessions SET sess = ?, expire = ? WHERE sid = ?").run(sessJson, expire, sid);
          } else {
            db.prepare("INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?)").run(sid, sessJson, expire);
          }
          callback(null);
        } catch (err) {
          console.error("Session store set error:", err);
          callback(err);
        }
      },
      destroy(sid, callback) {
        try {
          db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
          callback(null);
        } catch (err) {
          callback(err);
        }
      }
    };

    // Setup session middleware with database store
    app.use(session({
      secret: process.env.SESSION_SECRET || "dev-secret-key",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
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
