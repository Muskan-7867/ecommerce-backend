const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/usermodel.js");
const asyncHandler = require("../utills/asyncHandler.js");
const Address = require("../models/addressmodel.js");
const { sendWelcomeEmail } = require("../email/emailservice.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

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
    const baseUrl = ["https://omeg-bazaar-client.vercel.app" , "https://omegbazaar.com"]
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

// Delete user account
const deleteUserAccount = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ message: "Please provide password for verification" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Delete associated addresses first
    await Address.deleteMany({ user: userId });

    // Then delete the user
    await User.findByIdAndDelete(userId);

    // Send confirmation email
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
      subject: "Account Deletion Confirmation",
      html: "<p>Your account has been successfully deleted. We're sorry to see you go.</p>"
    });

    res.status(200).json({
      success: true,
      message: "User account deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user account",
      error: error.message
    });
  }
});

const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
};

const sendVerificationEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Email Verification OTP",
      html: `
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `
    });
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

const userRegisterApp = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ 
      success: false,
      message: "Please provide all fields: username, email, and password." 
    });
  }

  // Validate username
  if (username.length < 3) {
    return res.status(400).json({ 
      success: false,
      message: "Username must be at least 3 characters long." 
    });
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid email format." 
    });
  }

  // Validate password
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^+=])[A-Za-z\d@$!%*?&#^+=]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character."
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "User already exists with this email." 
      });
    }

    // Generate OTP and set expiration (10 minutes)
    const otp = generateOtp();
    const otpExpires = Date.now() + 600000;

    // Create unverified user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed after verification
      otp,
      otpExpires,
      isVerified: false
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, otp);
    } catch (emailError) {
      await User.deleteOne({ _id: user._id });
      return res.status(500).json({ 
        success: false,
        message: "Failed to send verification email." 
      });
    }

    res.status(201).json({
      success: true,
      message: "Verification OTP sent to your email. Please verify to complete registration.",
      userId: user._id
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error during registration" 
    });
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  // Validate input
  if (!userId || !otp) {
    return res.status(400).json({ 
      success: false,
      message: "User ID and OTP are required." 
    });
  }

  if (otp.length !== 4 || !/^\d+$/.test(otp)) {
    return res.status(400).json({ 
      success: false,
      message: "OTP must be a 4-digit number." 
    });
  }

  try {
    // Find user with matching userId and non-expired OTP
    const user = await User.findOne({
      _id: userId,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or OTP expired. Please request a new one."
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid OTP." 
      });
    }

    // Hash the password now that we've verified the email
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    // Update user as verified
    user.password = hashedPassword;
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d"
    });

    // Send welcome email (async - don't wait for it)
    sendWelcomeEmail({
      username: user.username,
      email: user.email
    }).catch(error => console.error("Welcome email error:", error));

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: true
      }
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error during verification" 
    });
  }
});

const resendOtp = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ 
      success: false,
      message: "User ID is required." 
    });
  }

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found." 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: "User is already verified." 
      });
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpExpires = Date.now() + 600000;

    // Update user with new OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send new verification email
    try {
      await sendVerificationEmail(user.email, otp);
    } catch (emailError) {
      return res.status(500).json({ 
        success: false,
        message: "Failed to resend verification email." 
      });
    }

    res.status(200).json({
      success: true,
      message: "New verification OTP sent to your email.",
      userId: user._id
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error while resending OTP" 
    });
  }
});

module.exports = {
  userRegister,
  userLogin,
  getUser,
  updateUserProfile,
  forgotPassword,
  fetchUserAddressFromId,
  getAllUsers,
  resetPassword,
  deleteUserAccount,
   verifyOtp,
  resendOtp,
  userRegisterApp
};
