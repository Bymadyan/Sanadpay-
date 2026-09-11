const bcrypt = require("bcryptjs");
const { findUser, createUser } = require("./database");

async function signup(req, res) {
  try {
    const { email, password, business_name, owner_name } = req.body;

    if (!email || !password || !business_name || !owner_name) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }

    const existing = await findUser(email);
    if (existing) {
      return res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    }

    const password_hash = bcrypt.hashSync(password, 10);

    const user = await createUser({
      email,
      password_hash,
      business_name,
      owner_name,
      phone: null,
      stripe_account_id: null
    });

    req.session.user = {
      id: user.id,
      email: user.email,
      business_name: user.business_name,
      owner_name: user.owner_name
    };

    res.json({ success: true, message: "تم إنشاء الحساب بنجاح" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "البريد والرقم السري مطلوبان" });
    }

    const user = await findUser(email);
    if (!user) {
      return res.status(401).json({ error: "بيانات دخول غير صحيحة" });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "بيانات دخول غير صحيحة" });
    }

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

function logout(req, res) {
  req.session.destroy(() => {
    res.json({ success: true, message: "تم تسجيل الخروج" });
  });
}

module.exports = { signup, login, logout };
