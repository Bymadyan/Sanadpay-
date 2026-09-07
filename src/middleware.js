const requireAuth = (req, res, next) => {
  console.log("🔐 requireAuth check - session.user:", req.session.user ? "exists" : "missing");
  if (!req.session.user) {
    if (req.accepts('json')) {
      console.log("  → Returning 401 JSON");
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.log("  → Redirecting to /login");
    return res.redirect("/login");
  }
  console.log("  → User authenticated, proceeding");
  next();
};

const requireGuest = (req, res, next) => {
  console.log("👤 requireGuest check - session.user:", req.session.user ? "exists" : "missing");
  if (req.session.user) {
    if (req.accepts('json')) {
      console.log("  → Returning 400 JSON (already logged in)");
      return res.status(400).json({ error: "Already logged in" });
    }
    console.log("  → Redirecting to /dashboard");
    return res.redirect("/dashboard");
  }
  console.log("  → Not logged in, proceeding");
  next();
};

module.exports = {
  requireAuth,
  requireGuest
};
