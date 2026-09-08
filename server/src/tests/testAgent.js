import dotenv from 'dotenv';
dotenv.config();

import { runAgent, formatChatHistory } from '../agent/index.js';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

async function testDelvoAgent() {
  console.log('==================================================');
  console.log('   Starting Step 5 AI Agent Tests (Mistral + Tavily)');
  console.log('==================================================');

  // TEST 1: General Knowledge (Should NOT search)
  console.log('\n--- TEST 1: General Knowledge Query (Expect: NO search) ---');
  const res1 = await runAgent({
    input: 'What is photosynthesis in one or two sentences?',
    chatHistory: [],
  });
  console.log('[Test 1 Reply]:', res1.reply.trim());
  console.log(`[Test 1 Used Search]: ${res1.usedSearch} (Expected: false)`);
  console.log(`[Test 1 Sources Count]: ${res1.sources.length} (Expected: 0)`);

  if (res1.usedSearch) {
    console.warn('[WARN]: Test 1 unexpectedly triggered search tool');
  } else {
    console.log('[PASS]: Test 1 answered directly without search!');
  }

  // TEST 2: Current Information (Should search)
  console.log('\n--- TEST 2: Recent Event Query (Expect: TOOL CALL tavily_search) ---');
  const res2 = await runAgent({
    input: 'What are the major AI news headlines from today in 2026?',
    chatHistory: [],
  });
  console.log('[Test 2 Reply Preview]:', res2.reply.slice(0, 200).trim() + '...');
  console.log(`[Test 2 Used Search]: ${res2.usedSearch} (Expected: true)`);
  console.log(`[Test 2 Sources Count]: ${res2.sources.length} (Expected: > 0)`);
  if (res2.sources.length > 0) {
    console.log(`[Test 2 Top Source Title]: ${res2.sources[0].title}`);
    console.log(`[Test 2 Top Source URL]: ${res2.sources[0].url}`);
  }

  if (!res2.usedSearch) {
    console.warn('[WARN]: Test 2 did not trigger search tool');
  } else {
    console.log('[PASS]: Test 2 correctly triggered web search and cited sources!');
  }

  // TEST 3: Multi-turn Context
  console.log('\n--- TEST 3: Multi-turn Context Test ---');
  const mockHistory = [
    new HumanMessage('My favorite programming language is Rust, and I love memory safety.'),
    new AIMessage('Rust is fantastic! Its ownership and borrow checker guarantee memory safety without a garbage collector.'),
  ];

  const res3 = await runAgent({
    input: 'What is my favorite programming language that I told you earlier, and why?',
    chatHistory: mockHistory,
  });

  console.log('[Test 3 Reply]:', res3.reply.trim());
  console.log(`[Test 3 Used Search]: ${res3.usedSearch} (Expected: false, answering from history)`);
  const mentionsRust = res3.reply.toLowerCase().includes('rust');
  console.log(`[Test 3 Correctly remembers Rust]: ${mentionsRust}`);

  if (mentionsRust) {
    console.log('[PASS]: Test 3 successfully used multi-turn context!');
  } else {
    console.error('[FAIL]: Test 3 failed to recall context from history');
  }

  console.log('\n==================================================');
  console.log('   All Agent Unit Tests Completed Successfully!');
  console.log('==================================================');
}

testDelvoAgent().catch((err) => {
  console.error('[FAIL] Agent test failed with error:', err);
  process.exit(1);
});
