import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { sendOtpMail } from "../utils/mailer.js";

const prisma = new PrismaClient();

// Register API
export const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: "Email already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.user.create({
            data: { email, password: hashedPassword, otp, otpExpiry },
        });

        await sendOtpMail(email, otp);

        res.status(201).json({ message: "User registered. Check email for OTP." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

// Verify OTP API
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.otp !== otp || new Date() > user.otpExpiry) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        await prisma.user.update({
            where: { email },
            data: { verified: true, otp: null, otpExpiry: null },
        });

        res.json({ message: "OTP verified successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};
