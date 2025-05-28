import connectDB  from "./src/config/db.js";
import express from "express";
import mainRouter from "./src/router/route.js"
import dotenv from "dotenv";
import cors from "cors";
import { rerunMachine } from "./rerun.js";

dotenv.config();

const BASE_URL = process.env.VITE_BASE_URL;
const app = express();
app.use(express.json());
const port = 3000;

connectDB();

const corsOptions ={
    origin: [ "https://ecommerc-eomeg.vercel.app/" , "http://localhost:5173" ],
    credentials:true,           
    optionSuccessStatus:200
}
app.use(cors(corsOptions));


app.use(mainRouter)
// setInterval(rerunMachine, 60000);

app.get('/', (req, res) => {
  res.send('Hello Worlddd!!');
})
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})



