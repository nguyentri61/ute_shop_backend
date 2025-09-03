import express from "express";
import {
    allCategories
} from "../controllers/categoryController.js";
const router = express.Router();

router.get("/all", allCategories)

export default router;
