import { Order } from "../models/order.model.js";
import { asyncHandler } from "../utills/asyncHandler.js";

const orderProduct = asyncHandler(async (req, res) => {
 
  
  const { quantity, orderItems, address, totalPrice, payment, totalQuantity } = req.body;
  

  if (!quantity || !address || !totalPrice || !payment) {
    return res.status(400).json({
      success: false,
      message: "Please fill all the fields"
    });
  }

  const order = await Order.create({
    
    address,
    quantity,
    totalPrice,
    totalQuantity,
    payment,
    orderItems,
    client: req.user._id,
    isPaid: payment ? true : false
  });

  return res.status(200).json({
    success: true,
    message: "Order Placed Successfully",
    order
  });
});

export { orderProduct}