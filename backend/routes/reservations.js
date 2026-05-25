import express from "express";
import auth from "../middleware/auth.js";
import Reservations from "../models/Reservations.js";
import Station from "../models/Station.js";

const router = express.Router();

/* ======================================================
   🔹 CREATE NEW RESERVATION (User)
====================================================== */
router.post("/", auth, async (req, res) => {
  try {
    const { stationId, startTime, endTime, vehicle, note } = req.body;

    if (!stationId || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "stationId, startTime, and endTime are required" });
    }

    const station = await Station.findById(stationId);
    if (!station) return res.status(404).json({ message: "Station not found" });

    // ✅ Prevent duplicate active reservations
    const existing = await Reservations.findOne({
      userId: req.user.id,
      stationId,
      status: { $in: ["pending", "accepted", "charging"] },
    });
    if (existing) {
      return res.status(400).json({
        message: "You already have an active reservation for this station.",
      });
    }

    const reservation = await Reservations.create({
      userId: req.user.id,
      stationId,
      startTime,
      endTime,
      vehicle,
      note,
      status: "pending",
    });

    res.status(201).json(reservation);
  } catch (err) {
    console.error("❌ Error creating reservation:", err);
    res.status(500).json({ message: "Failed to create reservation" });
  }
});

/* ======================================================
   🔹 GET ALL RESERVATIONS BY LOGGED-IN USER
====================================================== */
router.get("/me", auth, async (req, res) => {
  try {
    const list = await Reservations.find({ userId: req.user.id })
      .populate(
        "stationId",
        "name address rate speed lat lng availableChargers totalChargers"
      )
      .sort("-createdAt");
    res.json(list);
  } catch (err) {
    console.error("❌ Error fetching user reservations:", err);
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
});

/* ======================================================
   🔹 GET RESERVATIONS FOR A STATION (Station Owner)
====================================================== */
router.get("/station", auth, async (req, res) => {
  try {
    const myStation = await Station.findOne({ userId: req.user.id });
    if (!myStation) return res.json([]);

    const list = await Reservations.find({ stationId: myStation._id })
      .populate("userId", "name email")
      .sort("-createdAt");

    res.json(list);
  } catch (err) {
    console.error("❌ Error fetching station reservations:", err);
    res.status(500).json({ message: "Failed to fetch station reservations" });
  }
});

/* ======================================================
   🔹 UPDATE RESERVATION STATUS
====================================================== */
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = [
      "accepted",
      "declined",
      "cancelled",
      "charging",
      "completed",
    ];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const reservation = await Reservations.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });

    const station = await Station.findById(reservation.stationId);
    if (!station)
      return res.status(404).json({ message: "Linked station not found" });

    const prevStatus = reservation.status;

    /* ======================================================
       🔐 AUTHORIZATION
    ====================================================== */
    if (["accepted", "declined", "charging", "completed"].includes(status)) {
      if (
        station.userId.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this reservation" });
      }
    }

    if (status === "cancelled") {
      if (reservation.userId.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to cancel this reservation" });
      }
    }

    /* ======================================================
       ⚙️ AVAILABLE CHARGERS LOGIC (Final Fix)
    ====================================================== */
    console.log(
      `🔄 Reservation transition: ${prevStatus} → ${status} for station ${station.name}`
    );

    // ✅ Accept → decrease by 1
    if (
      status === "accepted" &&
      !["accepted", "charging"].includes(prevStatus)
    ) {
      if (station.availableChargers > 0) {
        station.availableChargers -= 1;
      }
    }

    // ✅ Decline / Cancel / Complete → increase by 1
    if (
      ["declined", "cancelled", "completed"].includes(status) &&
      ["accepted", "charging"].includes(prevStatus)
    ) {
      if (station.availableChargers < station.totalChargers) {
        station.availableChargers += 1;
      }
    }

    // ✅ Always enforce boundaries
    if (station.availableChargers < 0) station.availableChargers = 0;
    if (station.availableChargers > station.totalChargers)
      station.availableChargers = station.totalChargers;

    await station.save();
    console.log(
      `✅ Updated chargers for ${station.name}: ${station.availableChargers}/${station.totalChargers}`
    );

    /* ======================================================
       ✅ SAVE UPDATED RESERVATION
    ====================================================== */
    reservation.status = status;
    await reservation.save();

    const updatedReservation = await Reservations.findById(reservation._id)
      .populate("userId", "name email")
      .populate(
        "stationId",
        "name address rate speed lat lng availableChargers totalChargers"
      );

    // 📡 Broadcast to frontend dashboards
    try {
      const bc = new BroadcastChannel("stations_channel");
      bc.postMessage({ type: "stations_updated" });
      bc.close();
    } catch {
      console.log("BroadcastChannel not available (server)");
    }

    res.json({
      message: `Reservation updated to '${status}'`,
      reservation: updatedReservation,
      station,
    });
  } catch (err) {
    console.error("❌ Error updating Reservation:", err);
    res.status(500).json({ message: "Failed to update Reservation" });
  }
});

/* ======================================================
   🔹 DELETE RESERVATION (User)
====================================================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const reservation = await Reservations.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });

    if (reservation.userId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to delete" });

    if (["accepted", "charging"].includes(reservation.status)) {
      const station = await Station.findById(reservation.stationId);
      if (station) {
        station.availableChargers = Math.min(
          station.totalChargers,
          (station.availableChargers || 0) + 1
        );
        await station.save();
      }
    }

    await reservation.deleteOne();

    try {
      const bc = new BroadcastChannel("stations_channel");
      bc.postMessage({ type: "stations_updated" });
      bc.close();
    } catch {
      console.log("BroadcastChannel not available (server)");
    }

    res.json({ message: "Reservation deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting reservation:", err);
    res.status(500).json({ message: "Failed to delete reservation" });
  }
});

export default router;
