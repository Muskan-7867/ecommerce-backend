import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import { Address } from "../models/address.model.js";
import { sendWelcomeEmail } from "../email/emailservice.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Register controller
const userRegister = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Check for missing fields
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Please provide all fields." });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  // Password strength validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^+=])[A-Za-z\d@$!%*?&#^+=]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists." });
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create and save the user
  const user = await User.create({
    username,
    email,
    password: hashedPassword
  });

  // Generate JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d"
  });

  // Send welcome email (don't wait for it to complete)
  sendWelcomeEmail({
    username: user.username,
    email: user.email
  }).catch((error) => {
    console.error("Failed to send welcome email:", error);
    // Don't fail the registration if email fails
  });

  // Respond with token and user info
  res.status(201).json({
    message: "User registered successfully! and Email send Successfully!!!",
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  });
});

// Login controller
const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please provide all fields" });
  }

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Invalid email or password." });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(400).json({ message: "Invalid email or password." });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d"
  });

  console.log("from login", token);

  res.status(200).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      message: "login success"
    }
  });
});

//getuser by token
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password")
    .populate("address")
    .populate("order")
    .populate("order.orderItems");
  console.log("from get user", user.order);
  res.status(200).json({
    user: user,
    message: "User fetched successfully"
  });
});

//updateprofile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { username, email, contact, address } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { username, email, contact, address },
    { new: true }
  );
  res.status(200).json({ user, message: "User updated successfully" });
});

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("from forgot", user);
    // 2. Generate reset token
    const token = crypto.randomBytes(20).toString("hex");
    console.log("from forgot password", token);
    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 3600000;
    console.log("Saving token to user:", token);
    await user.save();
    console.log("User after save:", user);
    const updatedUser = await User.findOne({ email });
    console.log("Saved token:", updatedUser.resetPasswordToken);

    // 3. Send email with reset link
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    const baseUrl = "https://omeg-bazaar-client.vercel.app";
    console.log("base url", baseUrl);
    const resetUrl = `${baseUrl}/resetpassword/${token}`;

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      // from: "anil@omenterprisesgroup.in",
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset</p>
        <p >Click this <a href="${resetUrl}">link</a> to reset your password</p>
        <p>This link will expire in 1 hour</p>
      `
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    console.log("from backend resetpassword", token);
    const { newPassword } = req.body;

    // 1. Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });
    console.log("from backend resetpassword", user);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    // 2. Update password and clear token
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    // 3. Send confirmation email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Changed Successfully",
      html: "<p>Your password has been successfully changed</p>"
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchUserAddressFromId = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  // Make sure to await the DB call
  const address = await Address.findById(addressId);

  // Check if address exists
  if (!address) {
    return res.status(404).json({
      success: false,
      message: "Address not found"
    });
  }

  res.status(200).json({
    success: true,
    address
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-password")
    .populate("order.products")
    .populate("address");
  res.status(200).json({
    success: true,
    users
  });
});

export {
  userRegister,
  userLogin,
  getUser,
  updateUserProfile,
  forgotPassword,
  fetchUserAddressFromId,
  getAllUsers,
  resetPassword
};
