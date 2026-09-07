require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./db");
const SQLiteSessionStore = require("./sessionStore");

const authRoutes = require("./routes/auth");
const invoiceRoutes = require("./routes/invoices");
const paymentRoutes = require("./routes/payments");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let sessionStore;

function setupApp() {
  sessionStore = new SQLiteSessionStore();

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

  app.use((req, res, next) => {
    console.log(`\n🔗 ${req.method} ${req.path}`);
    console.log(`   Session ID: ${req.sessionID}`);
    console.log(`   User: ${req.session.user ? req.session.user.email : "anonymous"}`);
    res.locals.user = req.session.user || null;
    next();
  });

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/invoices", invoiceRoutes);
  app.use("/api/payments", paymentRoutes);

  app.get("/", (req, res) => {
    if (req.session.user) {
      return res.redirect("/dashboard");
    }
    res.render("landing");
  });

  app.get("/dashboard", (req, res) => {
    console.log("📊 Dashboard requested - session.user:", req.session.user ? `${req.session.user.email}` : "missing");
    if (!req.session.user) {
      console.log("  → No user session, redirecting to /login");
      return res.redirect("/login");
    }
    console.log("  → Rendering dashboard for:", req.session.user.email);
    res.render("dashboard");
  });

  app.get("/login", (req, res) => {
    console.log("🔓 Login page requested - session.user:", req.session.user ? "exists" : "missing");
    if (req.session.user) {
      console.log("  → User already logged in, redirecting to /dashboard");
      return res.redirect("/dashboard");
    }
    console.log("  → Rendering login page");
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

  app.use((req, res) => {
    res.status(404).render("404", { title: "Page Not Found" });
  });
}

const PORT = process.env.PORT || 3000;

(async () => {
  await db.initDb();
  setupApp();
  app.listen(PORT, () => {
    console.log(`🚀 SanadPay running on http://localhost:${PORT}`);
  });
})();
// Updated: Sun Sep  6 16:28:16 UTC 2026
