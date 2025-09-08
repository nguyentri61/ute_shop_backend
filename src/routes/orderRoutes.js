import express from "express";
import { myOrders, checkOutCOD } from "../controllers/orderController.js";
import { authMiddleware } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.get("/my-orders", authMiddleware, myOrders);
router.post("/checkout-cod", authMiddleware, checkOutCOD);

export default router;
