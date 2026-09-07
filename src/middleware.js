const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    if (req.accepts('json')) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.redirect("/login");
  }
  next();
};

const requireGuest = (req, res, next) => {
  if (req.session.user) {
    if (req.accepts('json')) {
      return res.status(400).json({ error: "Already logged in" });
    }
    return res.redirect("/dashboard");
  }
  next();
};

module.exports = {
  requireAuth,
  requireGuest
};
