import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'tl'], required: true },
  teamId: { type: String },
  avatarUrl: { type: String }
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tlId: { type: String, required: true },
  agents: [{ type: String }],
  avgActivation: { type: Number, default: 0 },
  totalActivations: { type: Number, default: 0 },
  totalSubmissions: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 }
});

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photoUrl: { type: String, required: true },
  teamId: { type: String, required: true },
  activationTarget: { type: Number, required: true },
  activations: { type: Number, default: 0 },
  submissions: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  lastSubmissionReset: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'image', 'video', 'audio'], required: true },
  title: { type: String },
  message: { type: String },
  mediaUrl: { type: String },
  isActive: { type: Boolean, default: true },
  duration: { type: Number, default: 15000 },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model('User', userSchema);
export const TeamModel = mongoose.model('Team', teamSchema);
export const AgentModel = mongoose.model('Agent', agentSchema);
export const NotificationModel = mongoose.model('Notification', notificationSchema);
