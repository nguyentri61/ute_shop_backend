import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.listen(5000, () => {
    console.log("🚀 Server running on http://localhost:5000");
});
