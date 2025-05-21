import  razorpay from "razorpay";

 export const CreateRazorPayInstance = () => {
    return new razorpay ({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    })
}