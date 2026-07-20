import mongoose, { Schema, Document } from 'mongoose';

export interface IVolunteer extends Document {
  user: mongoose.Types.ObjectId;
  skills: string[];
  status: 'Available' | 'Deployed' | 'Unavailable';
  contactPhone: string;
  currentTask?: string;
  assignedLocation?: {
    lat: number;
    lng: number;
    name?: string;
  };
  joinedAt: Date;
}

const VolunteerSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: [{ type: String, required: true }],
  status: { type: String, enum: ['Available', 'Deployed', 'Unavailable'], default: 'Available' },
  contactPhone: { type: String, required: true },
  currentTask: { type: String },
  assignedLocation: {
    lat: { type: Number },
    lng: { type: Number },
    name: { type: String }
  },
  joinedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IVolunteer>('Volunteer', VolunteerSchema);
