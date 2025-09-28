import { successResponse, errorResponse } from "../utils/response.js";
import { getDashboardStatsService } from "../services/dashboardService.js";

export const getDashboardStats = async (req, res) => {
    try {
        const stats = await getDashboardStatsService();
        return successResponse(res, "Thống kê tổng quan", stats);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};