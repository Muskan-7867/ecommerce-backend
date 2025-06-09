import express from "express";
import { sendContactEmail } from "../email/emailservice.js"


const emailRoutes = express.Router();

emailRoutes.post("/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const result = await sendContactEmail({ name, email, phone, message });

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(500).json(result);
  }
});



export default emailRoutes;
