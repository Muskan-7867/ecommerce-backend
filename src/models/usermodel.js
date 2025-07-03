// import mongoose from "mongoose";
// import crypto from "crypto";

const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    
  
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user"
    },
 
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address"
    },

    order: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);
// In your User model file
userSchema.methods.generatePasswordResetToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire time (1 hour from now)
  this.resetPasswordExpire = Date.now() + 3600000; // 1 hour
  
  return resetToken;
};
const User = mongoose.model("User", userSchema);
module.exports =  User;