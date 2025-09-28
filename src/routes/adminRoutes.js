import express from "express";
import { authMiddleware } from "../middlewares/authMiddlewares.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard/stats", getDashboardStats);


export default router;
