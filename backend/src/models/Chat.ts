import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  sender: 'User' | 'AI';
  agentName?: string; // Weather, Evacuation, Alert etc.
  message: string;
  timestamp: Date;
}

export interface IChat extends Document {
  user: mongoose.Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema({
  sender: { type: String, enum: ['User', 'AI'], required: true },
  agentName: { type: String },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IChat>('Chat', ChatSchema);
