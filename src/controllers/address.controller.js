import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";

const createAddress = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const { phone, street, city, state, pincode, address, address1, country } =
    req.body;

  if (
    !phone || !street || !city || !state ||
    !pincode || !address  || !country
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields"
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update if address exists
    if (user.address) {
      const existingAddress = await Address.findById(user.address);
      if (existingAddress) {
        existingAddress.street = street;
        existingAddress.city = city;
        existingAddress.state = state;
        existingAddress.country = country;
        existingAddress.address = address;
        existingAddress.address1 = address1;
        existingAddress.pincode = Number(pincode);
        existingAddress.phone = Number(phone);
        await existingAddress.save();

        return res.status(200).json({
          success: true,
          message: "Address updated successfully",
          data: existingAddress
        });
      }
    }

    // Create new address
    const newAddress = await Address.create({
      street,
      city,
      state,
      country,
      address,
      address1,
      pincode: Number(pincode),
      phone: Number(phone)
    });

    user.address = newAddress._id;
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: newAddress
    });

  } catch (error) {
    console.error("Error creating/updating address:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process address",
      error: error.message
    });
  }
});


export { createAddress };
