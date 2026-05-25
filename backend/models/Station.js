// backend/models/Station.js
import mongoose from "mongoose";

const stationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ✅ One station per user
    },
    name: { type: String, required: true },
    address: { type: String, required: true },
    speed: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    carType: { type: String, default: "All" },

    // ✅ Always define chargers with non-zero defaults
    totalChargers: { type: Number, required: true, default: 1 },
    availableChargers: { type: Number, required: true, default: 1 },

    lat: { type: Number, required: true },
    lng: { type: Number, required: true },

    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ======================================================
   🔹 Ensure availableChargers never exceeds totalChargers
====================================================== */
stationSchema.pre("save", function (next) {
  if (this.availableChargers == null || this.availableChargers < 0) {
    this.availableChargers = 0;
  }
  if (this.totalChargers == null || this.totalChargers < 1) {
    this.totalChargers = 1;
  }
  if (this.availableChargers > this.totalChargers) {
    this.availableChargers = this.totalChargers;
  }
  next();
});

export default mongoose.model("Station", stationSchema);
