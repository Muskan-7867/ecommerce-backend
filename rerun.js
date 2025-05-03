import axios from "axios"
export async function rerunMachine ()  {
 const data =  await axios.get("https://omeg-backend.onrender.com")
 console.log(data.data)
}