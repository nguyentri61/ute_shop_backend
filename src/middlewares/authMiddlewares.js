import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ code: 401, message: "Unauthorized: token required", data: null });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("FATAL: JWT_SECRET not set");
      return res.status(500).json({ code: 500, message: "Server misconfiguration", data: null });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ code: 401, message: "Unauthorized: invalid or expired token", data: null });
    }

    if (!decoded?.id) return res.status(401).json({ code: 401, message: "Unauthorized", data: null });

    req.user = decoded;
    next();
  } catch (err) {
    console.error("authMiddleware unexpected error:", err);
    return res.status(500).json({ code: 500, message: "Server error", data: null });
  }
};
