import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index on userId and updatedAt for quick retrieval of user's chats ordered by recency
chatSchema.index({ userId: 1, updatedAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
