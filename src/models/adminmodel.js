// import mongoose from "mongoose";
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    default: "admin",
  },
  totalProducts :{
    type: Number,
    default: 0,
    
  }
})

 const Admin = mongoose.model("Admin", adminSchema);
 module.exports = Admin;