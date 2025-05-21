import axios from "axios";
export async function rerunMachine() {
  try {
    const data = await axios.get("https:google.com");
  } catch (error) {}
  console.log(data);
}
