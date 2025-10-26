# UTE Shop Backend

Bản README cung cấp hướng dẫn nhanh để thiết lập, chạy và test dự án backend cho ứng dụng UTE Shop.

## Tổng quan

- Node.js + Express (ESM)
- Prisma (MySQL)
- Socket.IO cho realtime (thông báo + chat)
- Multer để upload file (ảnh/video tin nhắn)
- Swagger UI để xem tài liệu API

## Yêu cầu

- Node.js >= 18
- npm
- MySQL database

## Cài đặt nhanh

1. Clone repo
2. Cài dependencies

```powershell
npm install
```

3. Tạo file `.env` ở root với các biến môi trường cơ bản (ví dụ):

```
DATABASE_URL=mysql://USER:PASS@HOST:PORT/DB_NAME
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your-email-password-or-app-password
PORT=5000
BASE_PATH=/api
FRONTEND_URLS=http://localhost:5173
APP_NAME=UTEShop
SUPPORT_EMAIL=support@example.com
```

4. Sinh Prisma client (nếu cần hoặc sau khi cập nhật schema):

```powershell
npx prisma generate
```

5. Chạy migration (nếu bạn cần áp migration dev):

```powershell
npx prisma migrate deploy   # dùng khi deploy
# hoặc dev
npx prisma migrate dev --name init
```

## Scripts

- `npm run dev` — chạy `nodemon src/index.js` (phát triển)
- `npm start` — chạy `node server.js` (nếu có file server.js)

## Swagger (API docs)

Sau khi server chạy, mở:

- http://localhost:5000/api-docs

Trong Swagger UI bạn có thể nhập Bearer token để thử endpoint cần xác thực.

## Endpoints chính (tóm tắt)

(Ứng dụng dùng `basePath` mặc định `/api`)

- Auth:

  - `POST /api/auth/login` — đăng nhập (lấy token)
  - `POST /api/auth/register` — đăng ký

- Users, Products, Categories, Orders, ...: xem `src/routes/*.js` để biết đầy đủ

- Conversations / Chat:

  - `GET /api/conversations/all` — lấy hội thoại (user lấy của mình, admin lấy tất cả)
  - `GET /api/conversations/:id` — lấy 1 hội thoại
  - `POST /api/conversations/messages` — gửi tin nhắn (multipart/form-data)
    - Fields form-data:
      - `conversationId` (optional)
      - `type` (TEXT | IMAGE | VIDEO)
      - `content` (text)
      - `media` (file) — field name phải là `media`
    - Trả về object `message` vừa tạo. Uploaded files nằm ở `public/uploads/messages/` và có public URL `http://localhost:5000/public/uploads/messages/<filename>`

- Notifications: xem `src/services/notificationService.js` và `src/routes/notificationRoutes.js`

## Postman / cURL mẫu

Text message (cURL):

```powershell
curl -X POST "http://localhost:5000/api/conversations/messages" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "type=TEXT" \
  -F "content=Hello from cURL"
```

File message (Windows PowerShell cURL style):

```powershell
curl -X POST "http://localhost:5000/api/conversations/messages" -H "Authorization: Bearer <TOKEN>" -F "type=IMAGE" -F "content=Ảnh" -F "media=@C:\path\to\image.jpg"
```

## WebSocket (Socket.IO)

- Notification namespace: `/notification`

  - Client should emit `register` with `{ userId, role }` để server join rooms `user:<id>` hoặc `admin`.
  - Server emits event `notification` to room `user:<id>` or `admin`.

- Chat namespace: `/chat`
  - Client can emit `register_chat` with `{ userId, role }` to join `user:<id>` and `admin`.
  - Client can emit `join_conversation` with `conversationId` để join room `conversation:<id>`.
  - Server emits `new_message` to `conversation:<id>` when message được tạo.

## Upload / Media

- Uploads lưu ở `public/uploads/messages/` (multer). Đảm bảo folder này có quyền ghi.
- Truy xuất file: `http://<host>:<port>/public/uploads/messages/<filename>`

## Email

- Module gửi email nằm ở `src/utils/mailer.js`.
- Cấu hình bằng `EMAIL_USER` và `EMAIL_PASS`. Với Gmail bạn cần bật App Password hoặc Less Secure (không khuyến nghị).
- Templates HTML đã được cải thiện để hiển thị đẹp hơn (OTP, reset password).

## Debug & Logs

- Server inits socket và routes lazy-import; nếu có lỗi import sẽ in stacktrace và dừng.
- Kiểm tra biến `BASE_PATH` trong `.env` nếu bạn mount API ở đường dẫn khác.

## Gợi ý phát triển

- Nếu muốn lưu file lớn/nghiêm túc: upload trực tiếp lên S3 và lưu URL, tránh lưu file lớn trên server.
- Add tests, CI, và pipeline migrate trước khi deploy.

## Contributing

Mở PR, mô tả thay đổi, thêm migration cho Prisma khi schema đổi.

---

Nếu bạn muốn, mình có thể:

- Tạo file Postman collection/export.
- Viết thêm README phần mô tả bảng database (từ Prisma schema).
- Hoặc bổ sung hướng dẫn deploy (Docker / PM2).

Chọn tiếp gì bạn muốn mình làm?
