import {
    getAllCategories
} from "../services/categoryServices.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const allCategories = async (req, res) => {
    try {
        const categories = await getAllCategories();
        return successResponse(res, "Lấy tất cả loại", categories);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};