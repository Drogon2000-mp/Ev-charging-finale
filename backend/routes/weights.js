import express from "express";
import RecommendationWeights from "../models/RecommendationWeights.js";

const router = express.Router();

// Get weights
router.get("/", async (req, res) => {
  try {
    let weights = await RecommendationWeights.findOne();
    if (!weights) {
      weights = await RecommendationWeights.create({});
    }
    res.json(weights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update weights
router.put("/", async (req, res) => {
  try {
    let weights = await RecommendationWeights.findOne();
    if (!weights) {
      weights = await RecommendationWeights.create(req.body);
    } else {
      Object.assign(weights, req.body);
      await weights.save();
    }
    res.json(weights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
