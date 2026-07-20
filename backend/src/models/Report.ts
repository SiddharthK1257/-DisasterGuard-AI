import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'Fire' | 'Flooding' | 'Structural Damage' | 'Blockage' | 'Medical Emergency' | 'Other';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: 'Pending' | 'Verified' | 'Resolved' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['Fire', 'Flooding', 'Structural Damage', 'Blockage', 'Medical Emergency', 'Other'],
    required: true
  },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }
  },
  status: { type: String, enum: ['Pending', 'Verified', 'Resolved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IReport>('Report', ReportSchema);
