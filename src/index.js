// src/index.js — safe CORS + manual preflight + normalize basePath
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import http from "http";
import { initNotification } from "./services/notificationService.js";
import { initChatSocket } from "./services/conversationService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", credentials: true } });

// ==================== 🔔 INIT Notification ====================
initNotification(io);
io.of("/notification").on("connection", (socket) => {
  console.log("[Notification] Client connected:", socket.id);

  socket.on("register", ({ userId, role }) => {
    socket.join(`user:${userId}`);
    if (role === "ADMIN") socket.join("admin");
  });

  socket.on("disconnect", () =>
    console.log("[Notification] Client disconnected:", socket.id)
  );
});

// ==================== 💬 INIT Chat ====================
initChatSocket(io);
const chatNamespace = io.of("/chat");

chatNamespace.on("connection", (socket) => {
  console.log("[Chat] Client connected:", socket.id);

  socket.on("register_chat", ({ userId, role }) => {
    socket.join(`user:${userId}`);
    if (role === "ADMIN") socket.join("admin");
    console.log(
      `[Chat] ${socket.id} joined rooms for user:${userId} (${role})`
    );
  });

  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(
      `[Chat] ${socket.id} joined conversation:${conversationId} role: ${socket.data.role}`
    );
  });

  socket.on("disconnect", () => {
    console.log("[Chat] Client disconnected:", socket.id);
  });
});

// ==================== 🌐 CORS Config ====================
const FRONTENDS = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (FRONTENDS.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "x-skip-auth",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// --- Manual preflight handler ---
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && FRONTENDS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", corsOptions.methods.join(","));
  res.setHeader(
    "Access-Control-Allow-Headers",
    corsOptions.allowedHeaders.join(",")
  );
  if (corsOptions.credentials)
    res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(corsOptions.optionsSuccessStatus || 204);
  }
  next();
});

// ==================== 🧩 Normalize BASE_PATH ====================
console.log("ENV vars containing http(s):");
Object.entries(process.env)
  .filter(([k, v]) => typeof v === "string" && /https?:\/\//i.test(v))
  .forEach(([k, v]) => console.log(`  ${k} => ${v}`));
console.log("----");

const rawBase = (process.env.BASE_PATH || "/api").toString();
let basePath = "/api";
try {
  if (/^https?:\/\//i.test(rawBase))
    basePath = new URL(rawBase).pathname || "/api";
  else basePath = rawBase.startsWith("/") ? rawBase : `/${rawBase}`;
} catch (e) {
  console.warn("Invalid BASE_PATH, fallback to /api", e);
  basePath = "/api";
}
console.log("Using basePath:", basePath);

// ==================== 🚀 Lazy import routes ====================
(async () => {
  try {
    const { default: authRoutes } = await import("./routes/authRoutes.js");
    const { default: userRoutes } = await import("./routes/userRoutes.js");
    const { default: productRoutes } = await import(
      "./routes/productRoutes.js"
    );
    const { default: categoryRoutes } = await import(
      "./routes/categoryRoutes.js"
    );
    const { default: orderRoutes } = await import("./routes/orderRoutes.js");
    const { default: cartRoutes } = await import("./routes/cartRoutes.js");
    const { default: productVariantRoutes } = await import(
      "./routes/productVariantRoutes.js"
    );
    const { default: couponRoutes } = await import("./routes/couponRoutes.js");
    const { default: favoriteRoutes } = await import(
      "./routes/favoriteRoutes.js"
    );
    const { default: recentlyViewedRoutes } = await import(
      "./routes/recentlyViewedRoutes.js"
    );
    const { default: notificationRoutes } = await import(
      "./routes/notificationRoutes.js"
    );
    const { default: adminRoutes } = await import("./routes/adminRoutes.js");
    const { default: conversationRoutes } = await import(
      "./routes/conversationRoutes.js"
    );

    app.use(`${basePath}/auth`, authRoutes);
    app.use(`${basePath}/users`, userRoutes);
    app.use(`${basePath}/products`, productRoutes);
    app.use(`${basePath}/categories`, categoryRoutes);
    app.use(`${basePath}/orders`, orderRoutes);
    app.use(`${basePath}/carts`, cartRoutes);
    app.use(`${basePath}/product-variant`, productVariantRoutes);
    app.use(`${basePath}/coupons`, couponRoutes);
    app.use(`${basePath}/favorites`, favoriteRoutes);
    app.use(`${basePath}/recently-viewed`, recentlyViewedRoutes);
    app.use(`${basePath}/admin`, adminRoutes);
    app.use(`${basePath}/notifications`, notificationRoutes);
    app.use(`${basePath}/conversations`, conversationRoutes);
    app.use("/public", express.static(path.join(__dirname, "../public")));

    app.get("/", (req, res) => res.json({ ok: true }));

    app.use((err, req, res, next) => {
      console.error("Unhandled error:", err);
      res
        .status(err.status || 500)
        .json({ error: err.message || "Internal server error" });
    });

    const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
    server.listen(PORT, () =>
      console.log(`🚀 Server + Socket.IO running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Error importing/mounting routes:", err.stack || err);
    process.exit(1);
  }
})();
