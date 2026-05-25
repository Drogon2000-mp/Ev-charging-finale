// models/RecommendationWeights.js
import mongoose from "mongoose";

const RecommendationWeightsSchema = new mongoose.Schema({
  distance: { type: Number, default: 0.3 },
  price: { type: Number, default: 0.2 },
  availability: { type: Number, default: 0.2 },
  speed: { type: Number, default: 0.15 },
  rating: { type: Number, default: 0.15 }
}, { timestamps: true });

export default mongoose.model("RecommendationWeights", RecommendationWeightsSchema);
