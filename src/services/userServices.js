import { PrismaClient } from "@prisma/client";
import validator from "validator"; // For phone number validation

const prisma = new PrismaClient();

export const getCurrentUserService = async (userId) => {
    // Kiểm tra user có tồn tại không
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            fullName: true,
            address: true,
            phone: true,
            gender: true,
            role: true,
            verified: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new Error("Không tìm thấy người dùng");
    }

    return { user };
};

export const updateUserService = async (userId, updateData) => {
    // Validate input data
    if (updateData.phone && !validator.isMobilePhone(updateData.phone, "any")) {
        throw new Error("Invalid phone number format");
    }

    // Nên thêm region cụ thể cho VN
    if (updateData.phone && !validator.isMobilePhone(updateData.phone, "vi-VN")) {
        throw new Error("Số điện thoại không hợp lệ");
    }

    if (updateData.gender && !["MALE", "FEMALE", "OTHER"].includes(updateData.gender)) {
        throw new Error("Invalid gender value");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!existingUser) {
        throw new Error("User not found");
    }

    // Check if phone number already exists (chỉ khi phone được cập nhật)
    if (updateData.phone && updateData.phone !== existingUser.phone) {
        const phoneExists = await prisma.user.findFirst({
            where: {
                phone: updateData.phone,
                id: { not: userId } // Loại trừ user hiện tại
            },
        });
        if (phoneExists) {
            throw new Error("Phone number already exists");
        }
    }

    try {
        // Update user - chỉ cập nhật các field có giá trị
        const dataToUpdate = {};
        if (updateData.fullName !== undefined) dataToUpdate.fullName = updateData.fullName;
        if (updateData.address !== undefined) dataToUpdate.address = updateData.address;
        if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone;
        if (updateData.gender !== undefined) dataToUpdate.gender = updateData.gender;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
            select: {
                id: true,
                email: true,
                fullName: true,
                address: true,
                phone: true,
                gender: true,
                verified: true,
                createdAt: true,
            },
        });

        return { message: "User updated successfully", user: updatedUser };
    } catch (error) {
        console.error("Update user error:", error);

        if (error.code === "P2002") {
            // Có thể là unique constraint violation khác ngoài phone
            throw new Error("Dữ liệu đã tồn tại trong hệ thống");
        }
        throw new Error("Failed to update user: " + error.message);
    }
};