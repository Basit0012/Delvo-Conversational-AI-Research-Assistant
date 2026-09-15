import mongoose from 'mongoose';

const fileChunkSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadedFile',
      required: [true, 'File ID is required'],
      index: true,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Chat ID is required'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Chunk text content is required'],
    },
    embedding: {
      type: [Number],
      required: [true, 'Embedding vector is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Embedding must be a non-empty array of numbers',
      },
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    metadata: {
      fileName: { type: String, default: '' },
      pageNumber: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for strict chat-scoped vector retrieval and file cleanup
fileChunkSchema.index({ chatId: 1, fileId: 1 });
fileChunkSchema.index({ chatId: 1, chunkIndex: 1 });

const FileChunk = mongoose.model('FileChunk', fileChunkSchema);
export default FileChunk;
