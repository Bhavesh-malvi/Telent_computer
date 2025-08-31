import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  fees: { type: Number, required: true },
  duration: { type: String, required: true },
  badge: { type: String },
  category: { type: String, enum: ["IT", "Basic"], required: false },
  description: { type: String },
}, { timestamps: true });

export default mongoose.model('StudentCourse', courseSchema); 