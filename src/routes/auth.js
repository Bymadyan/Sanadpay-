const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { requireGuest, requireAuth } = require("../middleware");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, business_name, owner_name } = req.body;
    console.log(`📝 Signup attempt: ${email}`);

    if (!email || !password || !business_name || !owner_name) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      console.log(`⚠️  Email already exists: ${email}`);
      return res.status(400).json({ error: "Email is already in use" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (email, password_hash, business_name, owner_name) VALUES (?, ?, ?, ?)");
    const result = stmt.run(email, password_hash, business_name, owner_name);

    console.log(`✅ User created: ${email} (ID: ${result.lastInsertRowid})`);

    req.session.user = {
      id: result.lastInsertRowid,
      email,
      business_name,
      owner_name
    };

    req.session.save((err) => {
      if (err) {
        console.error(`❌ Session save error: ${err.message}`);
        return res.status(500).json({ error: "Error saving session" });
      }
      console.log(`✅ Session saved for ${email}`);
      res.json({ success: true, redirect: "/dashboard" });
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: "Error during signup" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`✅ User found: ${email} (ID: ${user.id})`);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      console.log(`❌ Password mismatch for: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`✅ Password valid for: ${email}`);

    req.session.user = {
      id: user.id,
      email: user.email,
      business_name: user.business_name,
      owner_name: user.owner_name
    };

    req.session.save((err) => {
      if (err) {
        console.error(`❌ Session save error: ${err.message}`);
        return res.status(500).json({ error: "Error saving session" });
      }
      console.log(`✅ Session saved for ${email}, redirecting to /dashboard`);
      res.json({ success: true, redirect: "/dashboard" });
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Error during login" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/");
    }
    res.redirect("/");
  });
});

module.exports = router;
