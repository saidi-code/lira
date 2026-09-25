import dotenv from "dotenv";

dotenv.config();

export default {
 
  
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || "gmail",
  EMAIL_USER: process.env.EMAIL_USER || "your-email@gmail.com",
  EMAIL_PASS: process.env.EMAIL_PASS || "your-email-password",
  EMAIL_FROM: process.env.EMAIL_FROM || "your-email@gmail.com",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};
