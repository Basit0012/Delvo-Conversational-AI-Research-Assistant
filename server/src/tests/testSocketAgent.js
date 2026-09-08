import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ClientIO } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import setupSocketIO from '../socket/index.js';

const TEST_PORT = 5099;

async function runSocketAgentTest() {
  console.log('====================================================');
  console.log('  Testing Sub-step 4: Socket.IO + AI Agent Service  ');
  console.log('====================================================');

  await connectDB();

  // Create Express & HTTP server for testing
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  setupSocketIO(io);

  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[Test Server]: Running on http://localhost:${TEST_PORT}`);

  // Create Test User and JWT
  const testEmail = `socket_test_${Date.now()}@delvo.ai`;
  const user = await User.create({
    username: 'socketTester',
    email: testEmail,
    password: 'password123',
  });

  const secret = process.env.JWT_SECRET || 'delvo_jwt_secret_dev_key_123456789';
  const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '1h' });

  // Create Test Chat thread
  const chat = await Chat.create({
    userId: user._id,
    title: 'New Chat',
  });
  console.log(`[PASS]: Test chat created with ID: ${chat._id}`);

  // Connect Socket.IO client with JWT
  const socketClient = ClientIO(`http://localhost:${TEST_PORT}`, {
    auth: { token },
    transports: ['websocket'],
  });

  await new Promise((resolve, reject) => {
    socketClient.on('connect', () => {
      console.log('[PASS]: Client connected and authenticated via Socket.IO');
      resolve();
    });
    socketClient.on('connect_error', (err) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });
  });

  // TEST 1: Send message through Socket.IO (General knowledge - direct reply)
  console.log('\n--- Socket Test 1: Direct knowledge question ---');
  const userPrompt = 'What is quantum entanglement in one simple sentence?';

  const responsePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for agent response')), 25000);

    socketClient.on('message:received', (msg) => {
      console.log(`[PASS]: Server acknowledged incoming message (ID: ${msg._id})`);
    });

    socketClient.on('agent:thinking', (data) => {
      console.log(`[PASS]: Received agent thinking status for chat ${data.chatId}`);
    });

    socketClient.on('message:response', (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    });

    socketClient.on('agent:error', (err) => {
      clearTimeout(timeout);
      reject(new Error(err.error));
    });
  });

  socketClient.emit('message:send', {
    chatId: chat._id.toString(),
    content: userPrompt,
  });

  const res1 = await responsePromise;
  console.log('[PASS]: Received assistant reply:', res1.message.content.trim());
  console.log(`[PASS]: Reply usedSearch flag: ${res1.message.usedSearch}`);

  // Verify MongoDB records
  const dbUserMsg = await Message.findOne({ chatId: chat._id, role: 'user' });
  const dbAssistantMsg = await Message.findOne({ chatId: chat._id, role: 'assistant' });

  if (!dbUserMsg) throw new Error('User message was not saved in MongoDB');
  if (!dbAssistantMsg) throw new Error('Assistant message was not saved in MongoDB');

  console.log('[PASS]: User and Assistant messages successfully verified in MongoDB');

  const updatedChat = await Chat.findById(chat._id);
  console.log(`[PASS]: Chat title updated to: "${updatedChat.title}"`);

  // Clean up
  socketClient.disconnect();
  await new Promise((resolve) => server.close(resolve));

  await Message.deleteMany({ chatId: chat._id });
  await Chat.findByIdAndDelete(chat._id);
  await User.findByIdAndDelete(user._id);
  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('  Sub-step 4 Socket.IO Agent Tests Passed!          ');
  console.log('====================================================');
}

runSocketAgentTest().catch((err) => {
  console.error('[FAIL]: Socket Agent test failed:', err);
  process.exit(1);
});
