import mongoose from 'mongoose';

const ProposalSchema = new mongoose.Schema({
  competitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true,
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
    default: 'draft',
  },
  files: [{
    type: String,
  }],
  score: {
    type: Number,
    min: 0,
    max: 100,
  },
  feedback: String,
  submittedAt: Date,
  reviewedAt: Date,
}, {
  timestamps: true,
});

export default mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);