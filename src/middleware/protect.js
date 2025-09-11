const jwt = require("jsonwebtoken");
const User = require("../models/usermodel.js")
const asyncHandler = require("../utills/asyncHandler.js");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1️⃣ Get token (from cookie or header)
  if (req.cookies?.authToken) {
    token = req.cookies.authToken;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 3️⃣ Attach user to request (exclude password field)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
});

module.exports = { protect };
