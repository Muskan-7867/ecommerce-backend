// import mongoose from 'mongoose';
const mongoose = require("mongoose");

export const CartSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    products:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required:true,
        },
        quantity:{
            type:Number,
            required:true,
        },
        price:{
            type:Number,
            required:true,
        },
        totalPrice:{
            type:Number,
            required:true,
        }

    }]
})

 const Cart = mongoose.model('Cart', CartSchema)
 module.exports = Cart