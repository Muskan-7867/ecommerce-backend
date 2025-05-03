import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import  fs  from "fs"

dotenv.config();

 cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key:process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
  secure: true
});

const uploadImage = async (filePath, folder = "/src/uploads") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "auto"
    });
    return result;
} catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

const uploadMultipleImages = async (filePaths, folder = "src/uploads") => {
  try {
    const uploadPromises = filePaths.map((filePath) =>
      uploadImage(filePath, folder)
    );
    return await Promise.all(uploadPromises);
    
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw error;
  }
};

const deleteImage = async(publicId) =>{
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(result)
  } catch (error) {
    console.error("Error deleting  image:", error);
    throw error;
  }
} 

const deleteMultipleImages = async(data) => {
  try {
    return await data.map((publicId) => deleteImage(publicId));
  } catch (error) {
    console.error("Error deleting multiple images:", error);
    throw error;
  }
}
export  {
  uploadImage,
  uploadMultipleImages,
  deleteMultipleImages
};
