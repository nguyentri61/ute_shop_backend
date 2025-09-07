import express from "express";
import { cartController } from "../controllers/cartController.js";
import { authMiddleware } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.use(authMiddleware); // Bắt buộc đăng nhập

//  Cart APIs
router.get("/", cartController.getCart);
router.post("/preview-checkout", cartController.getSelectedCart);
router.post("/add", cartController.addItem);
router.put("/update", cartController.updateItem);
router.delete("/remove/:variantId", cartController.removeItem);
router.delete("/clear", cartController.clearCart);

export default router;
