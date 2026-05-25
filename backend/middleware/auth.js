// middleware/auth.js
import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    // Accept token from multiple places for robustness
    // 1) Authorization header ("Bearer <token>")
    // 2) x-access-token header
    // 3) Authorization raw token
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const xAccessToken = req.headers["x-access-token"] || req.headers["X-Access-Token"];
    let token = null;

    if (authHeader) {
      // "Bearer <token>" or just "<token>"
      const parts = authHeader.split(" ");
      token = parts.length === 2 ? parts[1] : parts[0];
    } else if (xAccessToken) {
      token = xAccessToken;
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // verify
    const secret = process.env.JWT_SECRET || "devsecret";
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      console.error("Token verification failed:", err && err.message ? err.message : err);
      // 401 for expired/invalid token
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Accept multiple possible payload shapes (id, _id, userId)
    const id = decoded.id || decoded._id || decoded.userId;
    const role = decoded.role || decoded.user_role || decoded.roleName || decoded?.roleName;
    const email = decoded.email || decoded.emailAddress || decoded?.email;

    if (!id) {
      return res.status(403).json({ error: "Invalid token payload: missing user id" });
    }

    // default role fallback (do not assume admin)
    req.user = {
      id: id.toString(),
      role: role || "user",
      email: email || "",
    };

    next();
  } catch (err) {
    // Catch-all
    console.error("Auth middleware unexpected error:", err);
    return res.status(500).json({ error: "Auth middleware error" });
  }
}
