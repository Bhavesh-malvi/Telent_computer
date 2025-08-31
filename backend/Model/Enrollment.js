import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  course: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

export default mongoose.model('Enrollment', enrollmentSchema); 