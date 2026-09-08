import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Protect all chat routes with JWT auth
router.use(authenticateToken);

/**
 * POST /api/chats
 * Create a new chat thread for the authenticated user
 */
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    const chat = await Chat.create({
      userId: req.userId,
      title: title?.trim() || 'New Chat',
    });

    return res.status(201).json({ chat });
  } catch (error) {
    console.error('[Create Chat Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to create chat' });
  }
});

/**
 * GET /api/chats
 * List all chats for the authenticated user ordered by recency
 */
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId }).sort({ updatedAt: -1 });
    return res.status(200).json({ chats });
  } catch (error) {
    console.error('[List Chats Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to list chats' });
  }
});

/**
 * GET /api/chats/:id
 * Fetch a single chat thread and all its messages in chronological order
 */
router.get('/:id', async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or unauthorized' });
    }

    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });

    return res.status(200).json({
      chat,
      messages,
    });
  } catch (error) {
    console.error('[Get Chat Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch chat thread' });
  }
});

/**
 * DELETE /api/chats/:id
 * Delete a chat thread and all its messages
 */
router.delete('/:id', async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or unauthorized' });
    }

    await Message.deleteMany({ chatId: chat._id });

    return res.status(200).json({
      message: 'Chat and associated messages deleted successfully',
      chatId: chat._id,
    });
  } catch (error) {
    console.error('[Delete Chat Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete chat thread' });
  }
});

export default router;
