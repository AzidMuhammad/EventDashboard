import mongoose from 'mongoose';

const FinanceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  reference: String,
  source: {
    type: String,
    enum: ['manual', 'telegram', 'bank'],
    default: 'manual',
  },
  telegramData: {
    messageId: String,
    chatId: String,
    username: String,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Finance || mongoose.model('Finance', FinanceSchema);