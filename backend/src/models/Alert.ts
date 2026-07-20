import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  title: string;
  type: 'Flood' | 'Cyclone' | 'Earthquake' | 'Wildfire' | 'Landslide' | 'Drought' | 'Other';
  severity: 'Info' | 'Warning' | 'Critical';
  description: string;
  location: {
    lat: number;
    lng: number;
    name?: string;
  };
  source: 'USGS' | 'NASA' | 'Local Authority' | 'AI Prediction';
  isActive: boolean;
  timestamp: Date;
  details?: Record<string, any>;
}

const AlertSchema: Schema = new Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Flood', 'Cyclone', 'Earthquake', 'Wildfire', 'Landslide', 'Drought', 'Other'], 
    required: true 
  },
  severity: { type: String, enum: ['Info', 'Warning', 'Critical'], required: true },
  description: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    name: { type: String }
  },
  source: { type: String, enum: ['USGS', 'NASA', 'Local Authority', 'AI Prediction'], required: true },
  isActive: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: Schema.Types.Mixed }
});

export default mongoose.model<IAlert>('Alert', AlertSchema);
