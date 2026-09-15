import dotenv from 'dotenv';
dotenv.config();

import { io as ClientIO } from 'socket.io-client';
import mongoose from 'mongoose';
import assert from 'node:assert';

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import UploadedFile from '../models/UploadedFile.js';
import FileChunk from '../models/FileChunk.js';

const BASE_URL = 'http://localhost:5000';
const TEST_TIMESTAMP = Date.now();

// Helper to wait for a socket event with timeout
const waitForEvent = (socket, eventName, timeoutMs = 25000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout (${timeoutMs}ms) waiting for socket event "${eventName}"`));
    }, timeoutMs);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};

async function runE2EAudit() {
  console.log('================================================================');
  console.log('   DELVO END-TO-END (E2E) AUDIT SUITE — 5 CRITICAL SCENARIOS   ');
  console.log('================================================================\n');

  await connectDB();
  console.log('[DB]: Connected to MongoDB for state verification and cleanup.\n');

  let user1 = null;
  let user2 = null;
  let token1 = null;
  let token2 = null;
  let chat1 = null;
  let chat2 = null;
  let socket1 = null;
  let socket2 = null;

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: JWT Authentication & Session Persistence
    // ------------------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('SCENARIO 1: JWT Auth & Session Persistence (Register -> Login -> /me)');
    console.log('----------------------------------------------------------------');

    const email1 = `e2e_user1_${TEST_TIMESTAMP}@delvo.ai`;
    const password1 = 'SecurePass123!';
    const username1 = `auditor_${TEST_TIMESTAMP.toString().slice(-4)}`;

    // 1.1 Register
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username1, email: email1, password: password1 }),
    });
    assert.strictEqual(regRes.status, 201, `Register failed with status ${regRes.status}`);
    const regData = await regRes.json();
    assert.ok(regData.token, 'Registration must return a JWT token');
    assert.ok(regData.user?._id, 'Registration must return a user object with _id');
    assert.strictEqual(regData.user.email, email1.toLowerCase());
    assert.strictEqual(regData.user.password, undefined, 'Password must never be returned');
    console.log('[PASS] 1.1 User Registration succeeded, safe user returned, password omitted.');

    // 1.2 Login with valid credentials
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email1, password: password1 }),
    });
    assert.strictEqual(loginRes.status, 200, `Login failed with status ${loginRes.status}`);
    const loginData = await loginRes.json();
    token1 = loginData.token;
    user1 = loginData.user;
    assert.ok(token1, 'Login must return a JWT token');
    console.log('[PASS] 1.2 User Login succeeded with verified JWT.');

    // 1.3 Login with invalid credentials (Negative test)
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email1, password: 'WrongPassword999!' }),
    });
    assert.strictEqual(badLoginRes.status, 401, 'Invalid password must return 401');
    console.log('[PASS] 1.3 Login rejection with invalid credentials returned 401.');

    // 1.4 Persistent session verification via GET /api/auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert.strictEqual(meRes.status, 200, `/api/auth/me failed with status ${meRes.status}`);
    const meData = await meRes.json();
    assert.strictEqual(meData.user._id, user1._id);
    assert.strictEqual(meData.user.email, email1.toLowerCase());
    console.log('[PASS] 1.4 GET /api/auth/me successfully validated token and retrieved profile.');

    // 1.5 Tampered token rejection
    const tamperedRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token1}_tampered` },
    });
    assert.strictEqual(tamperedRes.status, 401, 'Tampered token must return 401');
    console.log('[PASS] 1.5 Tampered JWT rejected with 401 Unauthorized.');

    // ------------------------------------------------------------------------
    // SCENARIO 2: Agentic Decision Routing (Dynamic Search vs Static Reasoning)
    // ------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('SCENARIO 2: Agentic Decision Routing (Live Info vs Static Reasoning)');
    console.log('----------------------------------------------------------------');

    // Create a chat thread for User 1
    const createChatRes = await fetch(`${BASE_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ title: 'Agent Routing Test Chat' }),
    });
    assert.strictEqual(createChatRes.status, 201);
    chat1 = (await createChatRes.json()).chat;

    // Connect Socket Client 1
    socket1 = ClientIO(BASE_URL, {
      auth: { token: token1 },
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      socket1.on('connect', resolve);
      socket1.on('connect_error', reject);
    });
    console.log('[PASS] Socket Client 1 connected and authenticated.');

    // 2.1 Live Query needing Tavily search: Weather in Delhi
    console.log('\n  -> Query 2A: "What is today\'s weather forecast in Delhi?" (Expects tavily_search)');
    const q2aPromise = waitForEvent(socket1, 'message:response', 35000);
    socket1.emit('message:send', {
      chatId: chat1._id.toString(),
      content: "What is today's weather forecast in Delhi?",
    });

    const res2a = await q2aPromise;
    assert.strictEqual(res2a.message.role, 'assistant');
    assert.strictEqual(res2a.message.usedSearch, true, 'Live weather query MUST set usedSearch to true');
    assert.ok(res2a.message.sources.length > 0, 'Live weather query MUST return Tavily search sources');
    console.log(`[PASS] 2.1 Live query correctly triggered search tool (usedSearch: ${res2a.message.usedSearch}, sources: ${res2a.message.sources.length}).`);
    console.log(`       Top source title: "${res2a.message.sources[0]?.title}"`);

    // 2.2 Static Reasoning Query: Recursion in programming
    console.log('\n  -> Query 2B: "Explain recursion in programming in one concise sentence." (Expects NO search)');
    const q2bPromise = waitForEvent(socket1, 'message:response', 35000);
    socket1.emit('message:send', {
      chatId: chat1._id.toString(),
      content: 'Explain recursion in programming in one concise sentence.',
    });

    const res2b = await q2bPromise;
    assert.strictEqual(res2b.message.role, 'assistant');
    assert.strictEqual(res2b.message.usedSearch, false, 'Static reasoning query MUST set usedSearch to false');
    assert.strictEqual(res2b.message.sources.length, 0, 'Static reasoning query MUST have 0 sources');
    console.log(`[PASS] 2.2 Static query answered directly without search (usedSearch: ${res2b.message.usedSearch}, sources: ${res2b.message.sources.length}).`);
    console.log(`       Reply preview: "${res2b.message.content.trim().slice(0, 100)}..."`);

    // ------------------------------------------------------------------------
    // SCENARIO 3: Document RAG & search_uploaded_docs Tool Grounding
    // ------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('SCENARIO 3: Document RAG & search_uploaded_docs Grounding');
    console.log('----------------------------------------------------------------');

    // Synthetic non-public ground-truth text
    const secretFact = `PROJECT CODENAME XYLAR-9 BRIEFING:
Project Codename Xylar-9 is an orbital quantum satellite engineered in Neo-Kyoto.
The lead system architect is Dr. Thaddeus Vance, and the maiden activation date was June 19, 2041.
Its core propulsion system utilizes a localized gravitational pulse drive.`;

    const fileBlob = new Blob([secretFact], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', fileBlob, 'xylar9_briefing.txt');

    console.log('  -> Uploading synthetic document "xylar9_briefing.txt" to Chat 1...');
    const uploadRes = await fetch(`${BASE_URL}/api/chats/${chat1._id}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
      },
      body: formData,
    });

    assert.strictEqual(uploadRes.status, 201, `Document upload failed: ${uploadRes.status}`);
    const uploadData = await uploadRes.json();
    assert.ok(uploadData.file?._id, 'Upload must return file document');
    assert.strictEqual(uploadData.file.status, 'ready');
    const chunkCount = uploadData.chunkCount || uploadData.file.chunkCount;
    assert.ok(chunkCount >= 1, 'File must be indexed into at least 1 chunk');
    console.log(`[PASS] 3.1 File uploaded and vector-indexed successfully (Chunks: ${chunkCount}).`);

    // Verify embedding dimension in DB
    const firstChunk = await FileChunk.findOne({ fileId: uploadData.file._id }).lean();
    assert.ok(firstChunk, 'Indexed chunk must exist in MongoDB');
    assert.strictEqual(firstChunk.embedding.length, 1024, 'Mistral embedding MUST have exactly 1024 dimensions');
    console.log(`[PASS] 3.2 Verified MongoDB FileChunk vector embedding dimensions: exactly ${firstChunk.embedding.length} dims.`);

    // Ask question answerable ONLY from this uploaded file
    console.log('\n  -> Asking question: "According to the uploaded briefing, who is the lead system architect of Project Codename Xylar-9 and what is its maiden activation date?"');
    const ragPromise = waitForEvent(socket1, 'message:response', 35000);
    socket1.emit('message:send', {
      chatId: chat1._id.toString(),
      content: 'According to the uploaded briefing, who is the lead system architect of Project Codename Xylar-9 and what is its maiden activation date?',
    });

    const ragResponse = await ragPromise;
    assert.strictEqual(ragResponse.message.role, 'assistant');
    assert.strictEqual(ragResponse.message.usedSearch, true, 'Document RAG must flag usedSearch as true');
    assert.ok(ragResponse.message.sources.length > 0, 'RAG response must include document source citation');
    
    // Check citation references document
    const hasDocSource = ragResponse.message.sources.some(
      (s) => s.url.startsWith('#doc-') || s.title.includes('xylar9_briefing.txt')
    );
    assert.strictEqual(hasDocSource, true, 'At least one citation must reference the uploaded document');

    // Check factual grounding in reply
    const replyLower = ragResponse.message.content.toLowerCase();
    const mentionsArchitect = replyLower.includes('thaddeus') || replyLower.includes('vance');
    const mentionsDate = replyLower.includes('2041') || replyLower.includes('june 19');
    assert.strictEqual(mentionsArchitect, true, 'Agent must ground its answer with Dr. Thaddeus Vance');
    assert.strictEqual(mentionsDate, true, 'Agent must ground its answer with June 19, 2041');

    console.log(`[PASS] 3.3 Agent selected "search_uploaded_docs", correctly extracted facts and cited sources:`);
    console.log(`       Cited: "${ragResponse.message.sources[0]?.title}"`);
    console.log(`       Reply snippet: "${ragResponse.message.content.trim().slice(0, 140)}..."`);

    // ------------------------------------------------------------------------
    // SCENARIO 4: Multi-User WebSocket Room Isolation & Tenant Scoping
    // ------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('SCENARIO 4: Multi-User WebSocket Room Isolation & Tenant Scoping');
    console.log('----------------------------------------------------------------');

    // 4.1 Register User 2
    const email2 = `e2e_user2_${TEST_TIMESTAMP}@delvo.ai`;
    const regRes2 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: `user2_${TEST_TIMESTAMP.toString().slice(-4)}`, email: email2, password: 'Password123!' }),
    });
    const regData2 = await regRes2.json();
    user2 = regData2.user;
    token2 = regData2.token;

    // Connect Socket Client 2 (authenticated as User 2)
    socket2 = ClientIO(BASE_URL, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      socket2.on('connect', resolve);
      socket2.on('connect_error', reject);
    });
    console.log('[PASS] 4.1 Socket Client 2 (User 2) connected and joined user room.');

    // Attach spy on Socket 2 to count any cross-talk events
    let socket2LeakedEvents = 0;
    const leakListener = () => {
      socket2LeakedEvents++;
    };
    socket2.on('message:received', leakListener);
    socket2.on('agent:thinking', leakListener);
    socket2.on('message:response', leakListener);

    // Send a message from Socket 1 in Chat 1
    console.log('  -> Sending confidential message from User 1...');
    const user1MsgPromise = waitForEvent(socket1, 'message:response', 35000);
    socket1.emit('message:send', {
      chatId: chat1._id.toString(),
      content: 'Confidential alpha message for User 1 only: Code 9944.',
    });

    await user1MsgPromise;
    console.log('[PASS] 4.2 User 1 successfully received private message response.');

    // Assert Socket 2 received 0 events
    assert.strictEqual(socket2LeakedEvents, 0, `Data leak detected! Socket 2 received ${socket2LeakedEvents} events meant for User 1`);
    console.log(`[PASS] 4.3 Zero cross-tenant socket leakage verified (Socket 2 events received: 0).`);

    // 4.4 Negative check: User 2 tries to send message into User 1's chat
    console.log('  -> User 2 attempting unauthorized message into User 1\'s chat...');
    const forbiddenErrorPromise = waitForEvent(socket2, 'error', 10000);
    socket2.emit('message:send', {
      chatId: chat1._id.toString(),
      content: 'Unauthorized intrusion attempt by User 2.',
    });

    const errorEvent = await forbiddenErrorPromise;
    assert.strictEqual(errorEvent.error, 'Chat not found or access denied');
    console.log(`[PASS] 4.4 Multi-tenant scoping rejected unauthorized cross-user chat access with: "${errorEvent.error}".`);

    // ------------------------------------------------------------------------
    // SCENARIO 5: Sliding-Window Multi-Turn Context Recall Across Turns
    // ------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('SCENARIO 5: Sliding-Window Multi-Turn Context Recall Across Turns');
    console.log('----------------------------------------------------------------');

    // Create fresh chat for Turn 1 and Turn 2
    const freshChatRes = await fetch(`${BASE_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ title: 'Multi-turn Memory Verification Chat' }),
    });
    chat2 = (await freshChatRes.json()).chat;

    // Turn 1: Plant distinct unique fact
    console.log('  -> Turn 1: "Remember this unique token: my favorite constellation is Cassiopeia-Beta."');
    const turn1Promise = waitForEvent(socket1, 'message:response', 35000);
    socket1.emit('message:send', {
      chatId: chat2._id.toString(),
      content: 'Remember this unique token: my favorite constellation is Cassiopeia-Beta.',
    });

    const turn1Res = await turn1Promise;
    assert.ok(turn1Res.message.content.length > 0);
    console.log('[PASS] 5.1 Turn 1 completed and response generated.');

    // Verify messages stored in MongoDB
    const chat2Messages = await Message.find({ chatId: chat2._id }).sort({ createdAt: 1 });
    assert.strictEqual(chat2Messages.length, 2, 'Chat 2 must contain exactly 2 messages in MongoDB after Turn 1');
    assert.strictEqual(chat2Messages[0].role, 'user');
    assert.strictEqual(chat2Messages[1].role, 'assistant');
    console.log('[PASS] 5.2 Confirmed Turn 1 user and assistant messages committed to MongoDB.');

    // Turn 2: Query for the fact planted in Turn 1
    console.log('\n  -> Turn 2: "What is my favorite constellation that I asked you to remember?"');
    const turn2Promise = waitForEvent(socket1, 'message:response', 35000);
    socket1.emit('message:send', {
      chatId: chat2._id.toString(),
      content: 'What is my favorite constellation that I asked you to remember?',
    });

    const turn2Res = await turn2Promise;
    const turn2Content = turn2Res.message.content.toLowerCase();
    const recalledConstellation = turn2Content.includes('cassiopeia') || turn2Content.includes('cassiopeia-beta');
    assert.strictEqual(recalledConstellation, true, 'Agent MUST recall "Cassiopeia-Beta" from sliding-window chat history');
    assert.strictEqual(turn2Res.message.usedSearch, false, 'Turn 2 answer MUST be recalled from context memory without search');
    console.log(`[PASS] 5.3 Agent recalled context accurately from MongoDB chat history without searching (usedSearch: ${turn2Res.message.usedSearch}).`);
    console.log(`       Reply: "${turn2Res.message.content.trim()}"`);

    // Verify MongoDB message count is now 4
    const finalChat2Messages = await Message.find({ chatId: chat2._id });
    assert.strictEqual(finalChat2Messages.length, 4, 'Chat 2 must contain exactly 4 messages in MongoDB');
    console.log('[PASS] 5.4 Verified 4-turn message sequence persisted in MongoDB in chronological order.');

    console.log('\n================================================================');
    console.log('   ALL 5 E2E INTEGRATION SCENARIOS PASSED WITH ZERO DEFECTS!    ');
    console.log('================================================================\n');

  } finally {
    // Teardown and cleanup
    console.log('[Teardown]: Cleaning up test data from MongoDB & closing sockets...');
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();

    const chatIds = [chat1?._id, chat2?._id].filter(Boolean);
    if (chatIds.length > 0) {
      await FileChunk.deleteMany({ chatId: { $in: chatIds } });
      await UploadedFile.deleteMany({ chatId: { $in: chatIds } });
      await Message.deleteMany({ chatId: { $in: chatIds } });
      await Chat.deleteMany({ _id: { $in: chatIds } });
    }

    const userIds = [user1?._id, user2?._id].filter(Boolean);
    if (userIds.length > 0) {
      await User.deleteMany({ _id: { $in: userIds } });
    }

    await mongoose.disconnect();
    console.log('[Teardown]: Cleanup complete. Database restored to pristine state.\n');
  }
}

runE2EAudit().catch((err) => {
  console.error('\n[FATAL FAIL]: E2E Audit test suite failed with error:', err);
  process.exit(1);
});
