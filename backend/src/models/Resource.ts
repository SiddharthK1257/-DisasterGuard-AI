import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
  name: string;
  type: 'Shelter' | 'Hospital' | 'Police Station' | 'Fire Station' | 'Food Supply' | 'Water Supply' | 'Medical Supplies';
  capacity: {
    total: number;
    available: number;
    unit: string; // e.g., 'People', 'Units', 'Liters'
  };
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  contactPhone?: string;
  status: 'Operational' | 'Limited' | 'Inactive';
  lastUpdated: Date;
}

const ResourceSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Shelter', 'Hospital', 'Police Station', 'Fire Station', 'Food Supply', 'Water Supply', 'Medical Supplies'], 
    required: true 
  },
  capacity: {
    total: { type: Number, required: true },
    available: { type: Number, required: true },
    unit: { type: String, required: true, default: 'Units' }
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }
  },
  contactPhone: { type: String },
  status: { type: String, enum: ['Operational', 'Limited', 'Inactive'], default: 'Operational' },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model<IResource>('Resource', ResourceSchema);
