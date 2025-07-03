// import jwt from "jsonwebtoken";
// import { User } from "../models/user.model.js";
const jwt = require("jsonwebtoken");
const User = require("../models/usermodel.js");

const authenticator = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select(
      "username email role _id contact address order"
    );
    console.log("from auth", user);

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    (req.userId = user._id), (req.id = decoded.id);
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Invalid token", error: err.message });
  }
};

const roleAuthenticator = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    next();
  };
};

module.exports = { authenticator, roleAuthenticator };
