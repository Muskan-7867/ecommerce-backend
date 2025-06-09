import connectDB  from "./src/config/db.js";
import express from "express";
import mainRouter from "./src/router/route.js"
import dotenv from "dotenv";

import { sendEmail } from "./src/email/emailservice.js";
import cors from "cors";


dotenv.config();

const BASE_URL = process.env.VITE_BASE_URL;
const app = express();
app.use(express.json());
const port = 3000;

connectDB();
const corsOptions ={
    origin: ["https://omeg-bazaar-client.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials:true,           
    optionSuccessStatus:200,
    allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions));

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const result = await sendEmail({ name, email, phone, message });

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(500).json(result);
  }
});





app.use(mainRouter)
// setInterval(rerunMachine, 60000);

app.get('/', (req, res) => {
  res.send('Hello Worlddd!!');
})
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})



