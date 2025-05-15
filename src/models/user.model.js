import mongoose from "mongoose";

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
    
    contact: {
      type: String,
      required: true,
      minlength: 10
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
    }]
    
  },
  { timestamps: true }
);
export const User = mongoose.model("User", userSchema);
