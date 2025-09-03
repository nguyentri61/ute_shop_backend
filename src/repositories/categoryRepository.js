import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const findAllCategories = async () => {
    const categories = await prisma.category.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            icon: true,
            createdAt: true,

        },
    });

    return categories;
};
