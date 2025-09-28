import { successResponse, errorResponse } from "../utils/response.js";
import { getDashboardStatsService, getWeeklyRevenueService, getCategoryShareService } from "../services/dashboardService.js";

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
    try {
        const stats = await getDashboardStatsService();
        return successResponse(res, "Thống kê tổng quan", stats);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

// GET /api/dashboard/weekly-sales?status=DELIVERED
export const weeklySales = async (req, res) => {
    try {
        const status = req.query.status || "DELIVERED";
        const data = await getWeeklyRevenueService(status);
        return successResponse(res, "Doanh thu tuần", data);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
export const categoryShare = async (req, res) => {
    try {
        const { status = "DELIVERED", range, start, end } = req.query || {};
        const data = await getCategoryShareService({ status, range, start, end });
        return successResponse(res, "Phân bố doanh thu theo danh mục", data);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
