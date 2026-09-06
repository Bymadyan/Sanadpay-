const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { requireGuest, requireAuth } = require("../middleware");

const router = express.Router();

router.post("/signup", requireGuest, async (req, res) => {
  try {
    const { email, password, business_name, owner_name } = req.body;

    if (!email || !password || !business_name || !owner_name) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, business_name, owner_name)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(email, password_hash, business_name, owner_name);

    req.session.user = {
      id: result.lastInsertRowid,
      email,
      business_name,
      owner_name
    };

    res.json({ success: true, redirect: "/dashboard" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في التسجيل" });
  }
});

router.post("/login", requireGuest, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "البريد والكلمة المرور مطلوبان" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      return res.status(401).json({ error: "بيانات غير صحيحة" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "بيانات غير صحيحة" });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      business_name: user.business_name,
      owner_name: user.owner_name
    };

    res.json({ success: true, redirect: "/dashboard" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في تسجيل الدخول" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
