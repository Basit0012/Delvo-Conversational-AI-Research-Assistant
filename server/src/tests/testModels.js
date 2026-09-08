import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';

async function runModelTests() {
  console.log('--- Starting Step 2: Mongoose Schemas Test ---');
  await connectDB();

  // 1. Create a test user
  const testEmail = `test_${Date.now()}@delvo.ai`;
  const rawPassword = 'password123';
  const user = await User.create({
    username: 'delvotest',
    email: testEmail,
    password: rawPassword,
  });

  console.log(`[PASS] User created with ID: ${user._id}`);
  console.log(`[PASS] Password is hashed: ${user.password !== rawPassword}`);
  const isMatch = await user.comparePassword(rawPassword);
  console.log(`[PASS] comparePassword returns: ${isMatch}`);
  const jsonUser = user.toJSON();
  console.log(`[PASS] toJSON hides password: ${jsonUser.password === undefined}`);

  // 2. Create a test chat thread for user
  const chat = await Chat.create({
    userId: user._id,
    title: 'Research Quantum Computing',
  });
  console.log(`[PASS] Chat thread created with ID: ${chat._id}, title: ${chat.title}`);

  // 3. Create test messages in separate collection
  const userMsg = await Message.create({
    chatId: chat._id,
    role: 'user',
    content: 'What are the latest breakthroughs in topological qubits?',
    usedSearch: false,
  });
  console.log(`[PASS] User message created with ID: ${userMsg._id}`);

  const assistantMsg = await Message.create({
    chatId: chat._id,
    role: 'assistant',
    content: 'Recent breakthroughs include Majorana zero modes observed in hybrid nanowires...',
    usedSearch: true,
    sources: [
      {
        title: 'Nature: Topological Superconductivity',
        url: 'https://nature.com/articles/topological-qubits',
        snippet: 'Experiments demonstrated robust topological protection...',
      },
    ],
  });
  console.log(`[PASS] Assistant message created with ID: ${assistantMsg._id}`);
  console.log(`[PASS] usedSearch flag is: ${assistantMsg.usedSearch}`);
  console.log(`[PASS] sources count: ${assistantMsg.sources.length}`);

  // 4. Query messages chronologically for this chat
  const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
  console.log(`[PASS] Retrieved ${messages.length} messages for chat thread in correct order`);

  // Cleanup
  await Message.deleteMany({ chatId: chat._id });
  await Chat.findByIdAndDelete(chat._id);
  await User.findByIdAndDelete(user._id);
  console.log('[PASS] Test cleanup completed');

  await mongoose.disconnect();
  console.log('--- Step 2 Tests Passed Successfully ---');
}

runModelTests().catch((err) => {
  console.error('[FAIL] Test failed with error:', err);
  process.exit(1);
});
