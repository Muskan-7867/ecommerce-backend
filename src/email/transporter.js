// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "omegbazaar.com",
  service: "gmail",
   port: 465,
      secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

module.exports =  transporter;
