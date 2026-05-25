import mongoose from 'mongoose';

const connectDB = async () => {
  console.log("🔌 Connecting to MongoDB...");
  try {
    await mongoose.connect('mongodb+srv://Viserion2000:Dr%40gon1998@evstation.jkaymhh.mongodb.net/evstation?retryWrites=true&w=majority&appName=EvStation');
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;