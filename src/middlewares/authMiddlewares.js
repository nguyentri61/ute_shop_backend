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

export const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: "Unauthorized: authentication required", data: null });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ code: 403, message: "Forbidden: admin access required", data: null });
    }

    next();
  } catch (err) {
    console.error("adminMiddleware unexpected error:", err);
    return res.status(500).json({ code: 500, message: "Server error", data: null });
  }
};
