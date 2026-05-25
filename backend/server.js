import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js"; 
import userRoutes from "./routes/user.js";
import stationRoutes from "./routes/stations.js";
import reservationsRoutes from "./routes/reservations.js"

dotenv.config();

// Ensure JWT secret
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET not found in .env. Using fallback: devsecret");
  process.env.JWT_SECRET = "devsecret";
}

// Connect DB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Mount APIs
app.use("/api", userRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/reservations", reservationsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(
    `🔑 JWT_SECRET in use: ${
      process.env.JWT_SECRET === "devsecret" ? "devsecret (fallback)" : "from .env"
    }`
  );
});
