const jwt = require("jsonwebtoken");
const config = require("../config");

// Firma una cookie de sesión válida para el admin.
function signSession() {
  return jwt.sign({ role: "admin" }, config.adminSecret, { expiresIn: config.sessionTtl });
}

// Middleware: exige una cookie de sesión válida, si no responde 401.
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[config.cookieName];
  if (!token) return res.status(401).json({ error: "No autorizado" });
  try {
    jwt.verify(token, config.adminSecret);
    next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}

module.exports = { signSession, requireAuth };