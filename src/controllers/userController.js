import { updateUserService } from "../services/userServices.js";
import { errorResponse, successResponse } from "../utils/response.js";
import Joi from "joi";

// Schema validation cải tiến
const updateSchema = Joi.object({
    fullName: Joi.string().min(1).max(255).optional()
        .messages({
            'string.min': 'Họ và tên không được để trống',
            'string.max': 'Họ và tên không được vượt quá 255 ký tự'
        }),
    address: Joi.string().max(500).optional()
        .messages({
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự'
        }),
    phone: Joi.string().pattern(/^[0-9+\-\s()]{10,15}$/).optional()
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ'
        }),
    gender: Joi.string().valid("MALE", "FEMALE", "OTHER").optional()
        .messages({
            'any.only': 'Giới tính phải là MALE, FEMALE hoặc OTHER'
        })
}).min(1); // At least one field must be provided

export const updateUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return errorResponse(res, "Unauthorized", 401);
        }

        const { error, value: updateData } = updateSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false, // Không cho phép field không xác định
        });

        if (error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            return errorResponse(res, errorMessage, 400);
        }

        const result = await updateUserService(userId, updateData);
        return successResponse(res, result.message, result.user, 200);
    } catch (err) {
        console.error("updateUser error:", err);

        // Xác định status code phù hợp
        let statusCode = 500;
        let errorMessage = "Internal server error";

        if (err.message.includes("not found")) {
            statusCode = 404;
            errorMessage = err.message;
        } else if (err.message.includes("already exists") || err.message.includes("tồn tại")) {
            statusCode = 409; // Conflict
            errorMessage = err.message;
        } else if (err.message.includes("Invalid") || err.message.includes("không hợp lệ")) {
            statusCode = 400; // Bad Request
            errorMessage = err.message;
        }

        return errorResponse(res, errorMessage, statusCode);
    }
};