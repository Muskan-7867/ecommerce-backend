import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";

export const userAddress = asyncHandler(async (req, res) => {
  const userId = req.userId;
  console.log("userid", userId);

  const { phone, street, city, state, pincode, address, address1, country } =
    req.body;
  if (
    !phone ||
    !street ||
    !city ||
    !state ||
    !pincode ||
    !address ||
    !address1 ||
    !country
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields"
    });
  }

  try {
    const newAddress = await Address.create({
      street: street,
      city: city,
      state: state,
      country: country,
      address: address,
      address1: address1,
      pincode: Number(pincode),
      phone: Number(phone)
    });
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    user.address = newAddress._id;
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: newAddress
    });
  } catch (error) {
    console.error("Error creating address:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create address",
      error: error.message
    });
  }
});
