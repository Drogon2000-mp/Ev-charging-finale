import mongoose from 'mongoose';

const connectDB = async () => {
  console.log("🔌 Connecting to MongoDB...");
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not set");
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;