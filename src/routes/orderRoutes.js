import express from "express";
import { myOrders } from "../controllers/orderController.js";
import { authMiddleware } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.get("/my-orders", authMiddleware, myOrders);

export default router;
