import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Kiểm tra xem tài khoản admin đã tồn tại chưa
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@gmail.com" }
    });

    if (existingAdmin) {
      console.log("Tài khoản admin đã tồn tại!");
      return;
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash("admin", 10);

    // Tạo tài khoản admin
    const admin = await prisma.user.create({
      data: {
        email: "admin@gmail.com",
        password: hashedPassword,
        verified: true,
        role: "ADMIN",
        fullName: "Admin"
      }
    });

    console.log("Tạo tài khoản admin thành công:", admin);
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();