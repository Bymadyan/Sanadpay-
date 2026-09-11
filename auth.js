const bcrypt = require("bcryptjs");
const db = require("./database");

// Signup
function signup(req, res) {
  try {
    const { email, password, business_name, owner_name } = req.body;

    // Validation
    if (!email || !password || !business_name || !owner_name) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }

    // Check if email exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    }

    // Hash password
    const password_hash = bcrypt.hashSync(password, 10);

    // Insert user
    const stmt = db.prepare(
      "INSERT INTO users (email, password_hash, business_name, owner_name) VALUES (?, ?, ?, ?)"
    );
    const result = stmt.run(email, password_hash, business_name, owner_name);

    // Set session
    req.session.user = {
      id: result.lastInsertRowid,
      email,
      business_name,
      owner_name
    };

    res.json({ success: true, message: "تم إنشاء الحساب بنجاح" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
}

// Login
function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "البريد والرقم السري مطلوبان" });
    }

    // Find user
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      return res.status(401).json({ error: "بيانات دخول غير صحيحة" });
    }

    // Verify password
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "بيانات دخول غير صحيحة" });
    }

    // Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      business_name: user.business_name,
      owner_name: user.owner_name
    };

    res.json({ success: true, message: "تم الدخول بنجاح" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
}

// Logout
function logout(req, res) {
  req.session.destroy(() => {
    res.json({ success: true, message: "تم تسجيل الخروج" });
  });
}

module.exports = { signup, login, logout };
