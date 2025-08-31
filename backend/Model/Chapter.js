import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentCourse', required: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
  topics: [
    {
      name: { type: String, required: true },
      pdf: { type: String } // PDF file URL
    }
  ]
}, { timestamps: true });

export default mongoose.model('Chapter', chapterSchema); 