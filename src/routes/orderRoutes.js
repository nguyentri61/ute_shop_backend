import express from "express";
import {
  myOrders,
  checkOutCOD,
  cancel,
  updateOrderStatus,
  allOrders,
} from "../controllers/orderController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.get("/my-orders", authMiddleware, myOrders);
router.post("/checkout-cod", authMiddleware, checkOutCOD);
router.post("/:orderId/cancel", authMiddleware, cancel);
router.put("/:orderId/status", authMiddleware, updateOrderStatus); // adminMiddleware

// Lấy tất cả đơn hàng (admin)
router.get("/admin/all", authMiddleware, allOrders);
export default router;
