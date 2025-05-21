import { Admin } from "../models/admin.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Use the secret key from .env
const secret_key = process.env.JWT_SECRET_KEY || "defaultSecretKey"; // fallback for dev

// ✅ Create a new Admin
const createAdmin = async (req, res) => {
  const { name, email, role, password } = req.body;

  try {
    // Check if admin already exists
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Admin already exists with this email" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the admin
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Admin Login
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { _id: admin._id, email: admin.email },
       process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000, 
    });

    res
      .status(200)
      .json({ message: "Login successful", role: admin.role, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get Admin Info (requires auth middleware to set `req.admin`)
const getAdminInfo = async (req, res) => {
  const adminId = req.admin?._id;

  if (!adminId) {
    return res.status(401).json({ message: "Unauthorized: Admin ID missing" });
  }

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      admin,
      message: "Admin found",
    });
  } catch (error) {
    console.error("Get admin info error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export { createAdmin, adminLogin, getAdminInfo };
