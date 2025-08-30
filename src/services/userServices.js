import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateUserService = async (userId, updateData) => {
    // Kiểm tra user có tồn tại không
    const existingUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!existingUser) {
        throw new Error("User not found");
    }

    // Kiểm tra nếu phone được cập nhật và đã tồn tại
    if (updateData.phone && updateData.phone !== existingUser.phone) {
        const phoneExists = await prisma.user.findUnique({
            where: { phone: updateData.phone },
        });
        if (phoneExists) {
            throw new Error("Phone number already exists");
        }
    }

    // Cập nhật thông tin user
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            fullName: updateData.fullName,
            address: updateData.address,
            phone: updateData.phone,
            gender: updateData.gender,
        },
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
};