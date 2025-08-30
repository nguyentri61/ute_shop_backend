
import { updateUserService } from "../services/userServices.js";
import { errorResponse, successResponse } from "../utils/response.js";

export const updateUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return errorResponse(res, "Unauthorized", 401);
        }

        const { fullName, address, phone, gender } = req.body;

        // Validate input data
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (address !== undefined) updateData.address = address;
        if (phone !== undefined) updateData.phone = phone;
        if (gender !== undefined) updateData.gender = gender;

        // Kiểm tra nếu không có dữ liệu nào để cập nhật
        if (Object.keys(updateData).length === 0) {
            return errorResponse(res, "No data provided for update", 400);
        }

        const result = await updateUserService(userId, updateData);
        return successResponse(res, result.message, result.user);
    } catch (err) {
        console.error("updateUser error:", err);
        return errorResponse(res, err.message, 400);
    }
};
