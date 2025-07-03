// import jwt from "jsonwebtoken";
// import { Admin } from "../models/admin.model.js";

const jwt = require("jsonwebtoken");
const { Admin } = require("../models/adminmodel.js");

// Middleware to authenticate Admin via JWT
const adminAuthenticator = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // ✅ Decode JWT using the correct secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // ✅ Fetch the admin using the decoded ID
    const admin = await Admin.findById(decoded._id).select(
      "name email role _id"
    );

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    // ✅ Attach admin data to request
    req.admin = admin;
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res
      .status(401)
      .json({ message: "Invalid token", error: err.message });
  }
};

// Middleware to authorize specific role (e.g., "admin", "superadmin")
const roleAuthenticator = (requiredRole) => {
  return (req, res, next) => {
    if (!req.admin || req.admin.role !== requiredRole) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};

module.exports = { adminAuthenticator, roleAuthenticator };
