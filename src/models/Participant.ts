import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  competitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['registered', 'confirmed', 'disqualified'],
    default: 'registered',
  },
  teamMembers: [{
    type: String,
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);