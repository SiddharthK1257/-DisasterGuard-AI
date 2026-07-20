export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'Citizen' | 'Responder' | 'Admin';
  skills?: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

export interface Alert {
  id?: string;
  _id?: string;
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
  timestamp: string;
  details?: Record<string, any>;
}

export interface Resource {
  id?: string;
  _id?: string;
  name: string;
  type: 'Shelter' | 'Hospital' | 'Police Station' | 'Fire Station' | 'Food Supply' | 'Water Supply' | 'Medical Supplies';
  capacity: {
    total: number;
    available: number;
    unit: string;
  };
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  contactPhone?: string;
  status: 'Operational' | 'Limited' | 'Inactive';
  lastUpdated: string;
}

export interface Report {
  id?: string;
  _id?: string;
  user: User | string | any;
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
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  sender: 'User' | 'AI';
  agentName?: string;
  message: string;
  timestamp: string;
}

export interface Volunteer {
  id?: string;
  _id?: string;
  user: User | any;
  skills: string[];
  status: 'Available' | 'Deployed' | 'Unavailable';
  contactPhone: string;
  currentTask?: string;
  assignedLocation?: {
    lat: number;
    lng: number;
    name?: string;
  };
  joinedAt: string;
}

export interface RiskHazard {
  name: string;
  probability: number;
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: string[];
  recommendations: string;
}

export interface RiskReport {
  location: string;
  coordinates: { lat: number; lng: number };
  overallRiskScore: number;
  hazards: RiskHazard[];
  summary: string;
  isDemoMode?: boolean;
}
