// import mongoose from "mongoose";
const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pincode: { type: Number, required: true },
  phone: { type: Number, required: true },
  address: { type: String, required: true },
  address1: { type: String, default: "" },
  
}, { timestamps: true });

 const Address = mongoose.model("Address", addressSchema);
 module.exports = Address;