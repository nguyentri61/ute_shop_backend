import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendResetPasswordMail, sendOtpMail } from "../utils/mailer.js";

const prisma = new PrismaClient();

export const loginService = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  if (!user.verified) throw new Error("Please verify your email before login");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { message: "Login successful", accessToken };
};
export const getProfileById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      verified: true,
      createdAt: true,
      fullName: true,
      phone: true,
      address: true,
      gender: true,
      role: true,
    },
  });
  return user;
};
export const forgetPasswordService = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const resetPassword = crypto.randomBytes(6).toString("hex");
  const hashedPassword = await bcrypt.hash(resetPassword, 10);
  await sendResetPasswordMail(email, resetPassword);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return { message: "New password sent to your email" };
};

export const registerService = async (email, password) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already registered");

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.create({
    data: { email, password: hashedPassword, otp, otpExpiry },
  });

  await sendOtpMail(email, otp);

  return { message: "User registered. Check email for OTP." };
};

export const verifyOtpService = async (email, otp) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  if (user.otp !== otp || new Date() > user.otpExpiry) {
    throw new Error("Invalid or expired OTP");
  }

  await prisma.user.update({
    where: { email },
    data: { verified: true, otp: null, otpExpiry: null },
  });

  return { message: "OTP verified successfully" };
};
