// backend/routes/stations.js
import express from "express";
import Station from "../models/Station.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ======================================================
   🔹 GET all stations (public)
====================================================== */
router.get("/", async (_req, res) => {
  try {
    const stations = await Station.find();
    // Always return numeric fields properly
    const formatted = stations.map((s) => ({
      ...s.toObject(),
      totalChargers: Number(s.totalChargers) || 0,
      availableChargers:
        s.availableChargers != null ? Number(s.availableChargers) : Number(s.totalChargers) || 0,
    }));
    res.status(200).json(formatted);
  } catch (error) {
    console.error("Station fetch error:", error);
    res.status(500).json({ error: "Failed to fetch stations" });
  }
});

/* ======================================================
   🔹 GET my station
====================================================== */
router.get("/mystation", auth, async (req, res) => {
  try {
    const station = await Station.findOne({ userId: req.user.id });
    if (!station) return res.status(404).json({ message: "No station found" });

    const formatted = {
      ...station.toObject(),
      totalChargers: Number(station.totalChargers) || 0,
      availableChargers:
        station.availableChargers != null
          ? Number(station.availableChargers)
          : Number(station.totalChargers) || 0,
    };

    res.status(200).json(formatted);
  } catch (error) {
    console.error("mystation error:", error);
    res.status(500).json({ error: "Failed to fetch station" });
  }
});

/* ======================================================
   🔹 CREATE station
====================================================== */
router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      address,
      speed,
      rate,
      carType,
      totalChargers,
      availableChargers,
      lat,
      lng,
    } = req.body;

    if (!name || !address || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const exists = await Station.findOne({ userId: req.user.id });
    if (exists)
      return res.status(400).json({ error: "You already have a station. Please edit it instead." });

    const total = Number(totalChargers) > 0 ? Number(totalChargers) : 1; // at least 1
    const available =
      availableChargers != null && availableChargers !== ""
        ? Number(availableChargers)
        : total;

    const newStation = new Station({
      userId: req.user.id,
      name,
      address,
      speed: Number(speed) || 0,
      rate: Number(rate) || 0,
      carType,
      totalChargers: total,
      availableChargers: available,
      lat: Number(lat),
      lng: Number(lng),
    });

    const saved = await newStation.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Station create error:", error);
    res.status(500).json({ error: "Failed to create station" });
  }
});

/* ======================================================
   🔹 UPDATE station (PUT)
====================================================== */
router.put("/:id", auth, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ message: "Station not found" });

    if (station.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: admin/owner only" });
    }

    const update = { ...req.body };

    if (update.lat != null) update.lat = Number(update.lat);
    if (update.lng != null) update.lng = Number(update.lng);
    if (update.totalChargers != null)
      update.totalChargers = Number(update.totalChargers);
    if (update.availableChargers != null)
      update.availableChargers = Number(update.availableChargers);

    // Keep availableChargers ≤ totalChargers
    if (
      update.totalChargers != null &&
      update.availableChargers != null &&
      update.availableChargers > update.totalChargers
    ) {
      update.availableChargers = update.totalChargers;
    }

    const updated = await Station.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Station update error:", error);
    res.status(500).json({ error: "Failed to update station" });
  }
});

/* ======================================================
   🔹 PATCH (partial update)
====================================================== */
router.patch("/:id", auth, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ message: "Station not found" });

    if (station.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: admin/owner only" });
    }

    const updateData = req.body;

    if (updateData.lat != null) updateData.lat = Number(updateData.lat);
    if (updateData.lng != null) updateData.lng = Number(updateData.lng);
    if (updateData.availableChargers != null)
      updateData.availableChargers = Number(updateData.availableChargers);

    if (
      updateData.availableChargers != null &&
      updateData.availableChargers > station.totalChargers
    ) {
      updateData.availableChargers = station.totalChargers;
    }

    const updated = await Station.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Station PATCH error:", error);
    res.status(500).json({ error: "Failed to partially update station" });
  }
});

/* ======================================================
   🔹 DELETE station
====================================================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ message: "Station not found" });

    if (req.user.role === "admin" || station.userId.toString() === req.user.id) {
      await Station.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Station deleted successfully" });
    }

    return res.status(403).json({ error: "Forbidden: admin/owner required" });
  } catch (error) {
    console.error("Station delete error:", error);
    res.status(500).json({ error: "Failed to delete station" });
  }
});

export default router;
