import jwt from 'jsonwebtoken';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { runAgent } from '../agent/index.js';

/**
 * Configure Socket.IO authentication and real-time chat event handlers
 * @param {import('socket.io').Server} io
 */
export const setupSocketIO = (io) => {
  // Socket.IO JWT Authentication Middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const secret = process.env.JWT_SECRET || 'delvo_jwt_secret_dev_key_123456789';
      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      console.warn(`[Socket Auth Failed]: ${err.message}`);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);
    console.log(`[Socket.IO]: User authenticated (${socket.userId}) joined room ${userRoom}`);

    /**
     * Handle incoming chat message
     */
    socket.on('message:send', async ({ chatId, content }) => {
      try {
        if (!chatId || !content || !content.trim()) {
          return socket.emit('error', { error: 'chatId and non-empty content are required' });
        }

        // Validate chat ownership
        const chat = await Chat.findOne({ _id: chatId, userId: socket.userId });
        if (!chat) {
          return socket.emit('error', { error: 'Chat not found or access denied' });
        }

        // 1. Save incoming user message to MongoDB before agent processing
        const userMessage = await Message.create({
          chatId: chat._id,
          role: 'user',
          content: content.trim(),
          usedSearch: false,
          sources: [],
        });

        // Notify user socket that message is saved and processing started
        io.to(userRoom).emit('message:received', userMessage);
        io.to(userRoom).emit('agent:thinking', { chatId: chat._id });

        // 2. Invoke Delvo AI Agent (with automatic multi-turn context from DB)
        const agentResult = await runAgent({
          input: content.trim(),
          chatId: chat._id,
        });

        // 3. Save assistant's reply to MongoDB with search flags & citations
        const assistantMessage = await Message.create({
          chatId: chat._id,
          role: 'assistant',
          content: agentResult.reply,
          usedSearch: agentResult.usedSearch,
          sources: agentResult.sources || [],
        });

        // Update chat updatedAt timestamp and set title if default
        if (chat.title === 'New Chat') {
          chat.title = content.trim().slice(0, 40) + (content.trim().length > 40 ? '...' : '');
        }
        chat.updatedAt = new Date();
        await chat.save();

        // 4. Emit the assistant's reply back to the user's specific room (not broadcast)
        io.to(userRoom).emit('message:response', {
          message: assistantMessage,
          chatId: chat._id,
        });

        console.log(`[Socket.IO]: Dispatched agent response for chat ${chat._id} (search: ${agentResult.usedSearch})`);
      } catch (error) {
        console.error('[Socket.IO message:send Error]:', error);
        io.to(userRoom).emit('agent:error', {
          error: error.message || 'Failed to process message with AI agent',
          chatId,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO]: User disconnected (${socket.userId})`);
    });
  });
};

export default setupSocketIO;
