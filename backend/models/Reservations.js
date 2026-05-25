import mongoose from "mongoose";

const reservationsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },

    // 🔹 Reservation lifecycle states
    status: {
      type: String,
      enum: [
        "pending",   // Created but not yet handled by station owner
        "accepted",  // Accepted by station owner, waiting for arrival
        "declined",  // Declined by station owner
        "cancelled", // Cancelled by user
        "charging",  // User has arrived and started charging
        "completed", // Charging session finished
      ],
      default: "pending",
    },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    vehicle: { type: String },
    note: { type: String },

    // Optional charging metadata
    chargingStartTime: { type: Date },
    chargingEndTime: { type: Date },
    energyConsumed: { type: Number, default: 0 }, // in kWh
  },
  { timestamps: true }
);

export default mongoose.model("Reservations", reservationsSchema);
