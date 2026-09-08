import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    snippet: { type: String, default: '' },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Chat ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: [true, 'Message role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
    },
    usedSearch: {
      type: Boolean,
      default: false,
    },
    sources: {
      type: [sourceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on chatId and createdAt for efficient chronological pagination/history retrieval
messageSchema.index({ chatId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
