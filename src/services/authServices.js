import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendResetPasswordMail } from "../utils/mailer.js";

const prisma = new PrismaClient();

export const loginService = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  if (!user.verified) throw new Error("Please verify your email before login");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { message: "Login successful", accessToken };
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
