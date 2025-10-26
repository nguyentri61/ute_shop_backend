import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Gửi OTP
 */
export const sendOtpMail = async (to, otp) => {
  return transporter.sendMail({
    from: `"UTEShop" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Mã xác thực OTP của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
        <div style="max-width:500px; margin:auto; background:white; border-radius:8px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1)">
          <div style="background-color:#007bff; padding:16px; text-align:center; color:white;">
            <h2 style="margin:0;">UTEShop</h2>
          </div>
          <div style="padding:24px; text-align:center;">
            <h3>Mã OTP của bạn</h3>
            <p style="font-size:16px;">Dưới đây là mã OTP để xác thực tài khoản của bạn:</p>
            <div style="font-size:32px; font-weight:bold; color:#007bff; letter-spacing:5px; margin:20px 0;">${otp}</div>
            <p style="color:#555;">Mã này sẽ hết hạn sau <strong>5 phút</strong>.</p>
          </div>
          <div style="background-color:#f9f9f9; padding:12px; text-align:center; font-size:12px; color:#777;">
            © ${new Date().getFullYear()} UTEShop. All rights reserved.
          </div>
        </div>
      </div>
    `,
  });
};

/**
 * Gửi Reset Password
 */
export const sendResetPasswordMail = async (to, resetPassword) => {
  return transporter.sendMail({
    from: `"UTEShop" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔑 Cấp lại mật khẩu mới của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
        <div style="max-width:500px; margin:auto; background:white; border-radius:8px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1)">
          <div style="background-color:#28a745; padding:16px; text-align:center; color:white;">
            <h2 style="margin:0;">UTEShop</h2>
          </div>
          <div style="padding:24px; text-align:center;">
            <h3>Mật khẩu mới của bạn</h3>
            <p style="font-size:16px;">Hệ thống đã cấp lại mật khẩu mới cho tài khoản của bạn:</p>
            <div style="font-size:24px; font-weight:bold; color:#28a745; margin:20px 0;">${resetPassword}</div>
            <p style="color:#555;">Vui lòng đăng nhập và <strong>đổi mật khẩu</strong> để đảm bảo an toàn.</p>
          </div>
          <div style="background-color:#f9f9f9; padding:12px; text-align:center; font-size:12px; color:#777;">
            © ${new Date().getFullYear()} UTEShop. All rights reserved.
          </div>
        </div>
      </div>
    `,
  });
};
