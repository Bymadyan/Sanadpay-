require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./database");
const { signup, login, logout } = require("./auth");
const { createInvoice, listInvoices } = require("./invoices");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for Railway)
app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax"
  }
}));

// Make user available in routes
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Middleware: require authentication
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "يجب تسجيل الدخول" });
  }
  next();
}

// Home route
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Auth Routes
app.post("/api/auth/signup", signup);
app.post("/api/auth/login", login);
app.post("/api/auth/logout", logout);

// Auth pages
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/signup", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

// Dashboard
app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// User endpoint
app.get("/api/user", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "لم يتم تسجيل الدخول" });
  }
  res.json({ user: req.session.user });
});

// Invoices endpoints
app.post("/api/invoices/create", requireAuth, createInvoice);
app.get("/api/invoices/list", requireAuth, listInvoices);

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
