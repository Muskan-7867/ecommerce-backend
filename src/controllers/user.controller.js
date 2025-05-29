import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import { Address } from "../models/address.model.js";

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

  // Respond with token and user info
  res.status(201).json({
    message: "User registered successfully!",
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
    .populate("order");

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

//forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Please provide email" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User Not Found" });
  }

  const resetToken = user.getResetPasswordToken;

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/user/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click on the following link: ${resetUrl}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset request",
      message
    });
    res
      .status(200)
      .json({
        success: true,
        message: "password is forget successfully and Email sent successfully"
      });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res
      .status(500)
      .json({ success: false, message: "Email could not be sent" });
  }
});

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
  getAllUsers
};
