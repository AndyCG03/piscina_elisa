require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  adminUser: process.env.ADMIN_USER || "admin",
  adminPass: process.env.ADMIN_PASS || "admin",
  adminSecret: process.env.ADMIN_SECRET || "la-elisa-dev-secret-change-me",
  cookieName: "la_elisa_admin",
  sessionTtl: "8h",
};