import express from 'express';
import multer from 'multer';
import path from 'path';
import authenticateToken from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import UploadedFile from '../models/UploadedFile.js';
import FileChunk from '../models/FileChunk.js';
import { processAndIndexFile } from '../services/fileProcessingService.js';

const router = express.Router({ mergeParams: true });

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md']);
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type "${ext}". Only PDF (.pdf), Word (.docx), Plain Text (.txt), and Markdown (.md) are supported.`
        )
      );
    }
  },
});

/**
 * POST /api/chats/:chatId/files
 * Upload a document to a specific chat, extract text, chunk and index vectors
 */
router.post(
  '/:chatId/files',
  authenticateToken,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: `File exceeds maximum allowed size of 15MB. Please upload a smaller document.`,
          });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    const { chatId } = req.params;

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file was provided in the upload request.' });
      }

      // Verify chat exists and belongs to requesting user
      const chat = await Chat.findOne({ _id: chatId, userId: req.userId });
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found or access denied.' });
      }

      // 1. Create initial UploadedFile record in processing state
      const fileRecord = await UploadedFile.create({
        chatId: chat._id,
        userId: req.userId,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype || 'application/octet-stream',
        fileSize: req.file.size,
        status: 'processing',
      });

      try {
        // 2. Process text extraction, chunking, and embedding
        const result = await processAndIndexFile({
          fileRecord,
          buffer: req.file.buffer,
        });

        return res.status(201).json({
          message: `Successfully uploaded and indexed "${fileRecord.fileName}".`,
          file: fileRecord,
          chunkCount: result.chunkCount,
        });
      } catch (processingErr) {
        return res.status(422).json({
          error: processingErr.message || 'Failed to process document text.',
          file: fileRecord,
        });
      }
    } catch (error) {
      console.error('[Upload Route Error]:', error);
      return res.status(500).json({ error: error.message || 'Server error during file upload.' });
    }
  }
);

/**
 * GET /api/chats/:chatId/files
 * List all files uploaded to this chat
 */
router.get('/:chatId/files', authenticateToken, async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findOne({ _id: chatId, userId: req.userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied.' });
    }

    const files = await UploadedFile.find({ chatId: chat._id }).sort({ createdAt: -1 }).lean();

    return res.json({ files });
  } catch (error) {
    console.error('[Get Files Route Error]:', error);
    return res.status(500).json({ error: 'Failed to retrieve uploaded files.' });
  }
});

/**
 * DELETE /api/chats/:chatId/files/:fileId
 * Remove an uploaded file and its corresponding vector chunks
 */
router.delete('/:chatId/files/:fileId', authenticateToken, async (req, res) => {
  const { chatId, fileId } = req.params;

  try {
    const chat = await Chat.findOne({ _id: chatId, userId: req.userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied.' });
    }

    const file = await UploadedFile.findOne({ _id: fileId, chatId: chat._id });
    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Delete chunks and file record
    await FileChunk.deleteMany({ fileId: file._id, chatId: chat._id });
    await UploadedFile.deleteOne({ _id: file._id });

    return res.json({ message: `File "${file.fileName}" and its chunks were deleted.` });
  } catch (error) {
    console.error('[Delete File Route Error]:', error);
    return res.status(500).json({ error: 'Failed to delete file.' });
  }
});

export default router;
