const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

const requireGuest = (req, res, next) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  next();
};

module.exports = {
  requireAuth,
  requireGuest
};
