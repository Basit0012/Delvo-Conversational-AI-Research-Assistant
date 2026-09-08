import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import mongoose from 'mongoose';
import { app } from '../index.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

const TEST_PORT = 5088;

async function runRoutesTest() {
  console.log('====================================================');
  console.log('       Testing Auth and Chat REST API Routes        ');
  console.log('====================================================');

  await connectDB();
  const server = http.createServer(app);
  await new Promise((res) => server.listen(TEST_PORT, res));
  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  const uniqueId = Date.now();
  const testEmail = `route_test_${uniqueId}@delvo.ai`;
  const rawPassword = 'securePassword123';

  // 1. Register User
  console.log('\n--- 1. Testing POST /api/auth/register ---');
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'RouteTester',
      email: testEmail,
      password: rawPassword,
    }),
  });
  const regData = await regRes.json();
  if (regRes.status !== 201) throw new Error(`Register failed: ${JSON.stringify(regData)}`);
  console.log(`[PASS] Registered successfully. User ID: ${regData.user._id}`);
  console.log(`[PASS] Token received: ${!!regData.token}`);
  console.log(`[PASS] Password hidden: ${regData.user.password === undefined}`);

  const token = regData.token;

  // 2. Login User
  console.log('\n--- 2. Testing POST /api/auth/login ---');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: rawPassword,
    }),
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  console.log('[PASS] Login successful with valid credentials');

  // Test bad credentials
  const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'wrongPassword',
    }),
  });
  if (badLoginRes.status === 401) {
    console.log('[PASS] Bad login rejected with 401 and generic error');
  } else {
    throw new Error('Bad login was not rejected with 401');
  }

  // 3. GET /me
  console.log('\n--- 3. Testing GET /api/auth/me ---');
  const meRes = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  if (meRes.status !== 200 || meData.user.email !== testEmail) {
    throw new Error('GET /me failed');
  }
  console.log(`[PASS] GET /me verified for user: ${meData.user.username}`);

  // 4. POST /api/chats
  console.log('\n--- 4. Testing POST /api/chats ---');
  const createChatRes = await fetch(`${baseUrl}/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title: 'AI Ethics & Governance' }),
  });
  const createChatData = await createChatRes.json();
  if (createChatRes.status !== 201) throw new Error('Create chat failed');
  const chatId = createChatData.chat._id;
  console.log(`[PASS] Created chat thread: ${chatId} ("${createChatData.chat.title}")`);

  // 5. GET /api/chats
  console.log('\n--- 5. Testing GET /api/chats ---');
  const listChatsRes = await fetch(`${baseUrl}/chats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listChatsData = await listChatsRes.json();
  if (listChatsRes.status !== 200 || !Array.isArray(listChatsData.chats) || listChatsData.chats.length === 0) {
    throw new Error('List chats failed');
  }
  console.log(`[PASS] Listed ${listChatsData.chats.length} chat threads for current user`);

  // 6. GET /api/chats/:id
  console.log('\n--- 6. Testing GET /api/chats/:id ---');
  // Seed a message for this chat
  await Message.create({
    chatId,
    role: 'user',
    content: 'What are the main ethical issues with LLMs?',
    usedSearch: false,
  });

  const getChatRes = await fetch(`${baseUrl}/chats/${chatId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getChatData = await getChatRes.json();
  if (getChatRes.status !== 200 || getChatData.messages.length !== 1) {
    throw new Error('Get chat thread failed');
  }
  console.log(`[PASS] Fetched chat thread with ${getChatData.messages.length} messages`);

  // 7. DELETE /api/chats/:id
  console.log('\n--- 7. Testing DELETE /api/chats/:id ---');
  const delChatRes = await fetch(`${baseUrl}/chats/${chatId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (delChatRes.status !== 200) throw new Error('Delete chat failed');

  const remainingMessages = await Message.find({ chatId });
  if (remainingMessages.length === 0) {
    console.log('[PASS] Chat thread and all messages deleted successfully (cascade verified)');
  } else {
    throw new Error('Messages were not cascade-deleted');
  }

  // Cleanup user
  await User.findByIdAndDelete(regData.user._id);
  await new Promise((res) => server.close(res));
  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('       All Auth and Chat Route Tests Passed!        ');
  console.log('====================================================');
}

runRoutesTest().catch((err) => {
  console.error('[FAIL]: Route tests failed:', err);
  process.exit(1);
});
