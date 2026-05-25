import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Helper: JWT signer
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });

/* 🟩 SIGNUP */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || "user",
    });

    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      role: user.role,
      email: user.email,
      userId: user._id,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  }
});

/* 🟩 LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Hardcoded admin account (bypass DB)
    if (email === "admin@gmail.com" && password === "admin@1234") {
      const token = signToken({
        id: "admin",
        email,
        role: "admin",
      });
      return res.json({
        message: "Admin login successful",
        token,
        role: "admin",
        email,
        userId: "admin",
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      email: user.email,
      userId: user._id,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* 🟩 GET USERS BY ROLE */
router.get("/users/role/user", async (_req, res) => {
  try {
    const users = await User.find({ role: "user" }, "-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/users/role/stationUser", async (_req, res) => {
  try {
    const stationUsers = await User.find({ role: "stationUser" }, "-password");
    res.json(stationUsers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch station users" });
  }
});

/* 🟩 DELETE USER / STATION USER (Admin only) */
router.delete("/users/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden: admin only" });

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/* 🟩 GET CURRENT LOGGED-IN USER INFO */
router.get("/users/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Fetch user error:", err);
    res.status(500).json({ message: "Failed to fetch user info" });
  }
});

/* 🟩 CHANGE PASSWORD (via email) */
router.post("/change-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res.status(400).json({ message: "Email and new password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully!" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
});
/* ======================================================
   🔹 GET CURRENT USER INFO
   ====================================================== */
router.get("/users/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email name role");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user info:", err);
    res.status(500).json({ message: "Failed to fetch user info" });
  }
});

/* ======================================================
   🔹 CHANGE PASSWORD
   ====================================================== */
router.patch("/users/change-password", auth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ message: "New password is required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password changed successfully!" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
});


export default router;
