import dotenv from 'dotenv';
dotenv.config();

import { ChatMistralAI } from '@langchain/mistralai';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

import { createTavilyTool } from './tavilyTool.js';
import { createDocSearchTool } from './docSearchTool.js';
import Message from '../models/Message.js';

// Model selection: defaults to codestral-latest or mistral-medium if configured
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'codestral-latest';

const SYSTEM_PROMPT = `You are Delvo, an intelligent AI research assistant.
You have access to two tools:
1. "search_uploaded_docs": Searches through documents (PDFs, DOCX, TXT, MD) uploaded by the user to this conversation.
2. "tavily_search": Searches the live web for current real-time news, facts, and external online data.

CRITICAL ROUTING & CITATION RULES:
1. If the user asks about an uploaded document, file, attachment, report, or data from their uploaded files, call "search_uploaded_docs" first.
2. Call "tavily_search" ONLY when the user's question explicitly or implicitly requires current, real-time, recent news/events, or external web facts that you do not already know.
3. If the user asks general knowledge, coding, math, historical facts, logical reasoning, or something already discussed, answer directly without tools.
4. You may call both tools if the user's inquiry connects an uploaded document with current live web information.
5. INLINE CITATIONS: When citing facts from search results or uploaded documents, place inline citation markers like [1], [2] directly after the supported sentence or claim (corresponding to Source 1, Source 2, etc.). Do not fabricate citation numbers.`;

/**
 * Format MongoDB message documents into LangChain chat history messages.
 * @param {Array} dbMessages - Array of Mongoose Message documents
 * @returns {Array} - Array of LangChain BaseMessage instances
 */
export const formatChatHistory = (dbMessages = []) => {
  return dbMessages
    .map((msg) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'assistant') {
        return new AIMessage(msg.content);
      } else if (msg.role === 'system') {
        return new SystemMessage(msg.content);
      }
      return null;
    })
    .filter(Boolean);
};

/**
 * Fetch the last N chronological messages for a given chat ID from MongoDB.
 * @param {string|mongoose.Types.ObjectId} chatId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const fetchChatHistoryFromDB = async (chatId, limit = 10) => {
  if (!chatId) return [];
  // Find recent messages in chronological order (oldest -> newest among the last N)
  const recentMessages = await Message.find({ chatId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return recentMessages.reverse();
};

/**
 * Run the Delvo AI Agent for an incoming user input.
 * 
 * @param {Object} params
 * @param {string} params.input - User prompt/question
 * @param {Array} [params.chatHistory] - Optional pre-formatted LangChain messages
 * @param {string} [params.chatId] - Optional chatId to fetch history from DB
 * @returns {Promise<{ reply: string, usedSearch: boolean, sources: Array<{title: string, url: string, snippet: string}> }>}
 */
export const runAgent = async ({ input, chatHistory = [], chatId = null }) => {
  let structuredSources = [];

  // 1. Web search tool (Tavily)
  const searchTool = createTavilyTool({
    onResults: (sources) => {
      structuredSources.push(...sources);
    },
  });

  const tools = [searchTool];

  // 2. Chat-scoped document search tool (RAG)
  if (chatId) {
    const docSearchTool = createDocSearchTool({
      chatId,
      onResults: (chunks) => {
        const docSources = chunks.map((c) => ({
          title: `${c.fileName} (Chunk ${c.chunkIndex + 1})`,
          url: `#doc-${encodeURIComponent(c.fileName)}`,
          snippet: c.text,
        }));
        structuredSources.push(...docSources);
      },
    });
    tools.push(docSearchTool);
  }

  // Initialize Mistral LLM
  const llm = new ChatMistralAI({
    model: MISTRAL_MODEL,
    apiKey: process.env.MISTRAL_API_KEY,
    temperature: 0.3,
    streaming: false,
  });

  // Construct prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ]);

  // Create tool-calling agent and executor
  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    returnIntermediateSteps: true,
    maxIterations: 4,
  });

  // Resolve chat history if chatId is provided and chatHistory is empty
  let history = chatHistory;
  if (history.length === 0 && chatId) {
    let dbMessages = await fetchChatHistoryFromDB(chatId, 11);
    // When called via Socket.IO, the user message was already persisted to DB.
    // Exclude it from history so the prompt does not contain duplicate consecutive HumanMessages.
    if (
      dbMessages.length > 0 &&
      dbMessages[dbMessages.length - 1].role === 'user' &&
      dbMessages[dbMessages.length - 1].content.trim() === input.trim()
    ) {
      dbMessages = dbMessages.slice(0, -1);
    }
    history = formatChatHistory(dbMessages.slice(-10));
  }

  console.log(`\n[Agent]: Processing question: "${input}"`);
  console.log(`[Agent]: Loaded ${history.length} previous messages for context`);

  // Invoke agent
  const result = await executor.invoke({
    input,
    chat_history: history,
  });

  const intermediateSteps = result.intermediateSteps || [];
  const searchSteps = intermediateSteps.filter(
    (step) => step.action?.tool === 'tavily_search'
  );
  const docSteps = intermediateSteps.filter(
    (step) => step.action?.tool === 'search_uploaded_docs'
  );
  const usedSearch = searchSteps.length > 0 || docSteps.length > 0;

  // Visual visibility logging required by specification
  if (searchSteps.length > 0) {
    console.log(`[Agent Routing]: TOOL CALLED (tavily_search)`);
  }
  if (docSteps.length > 0) {
    console.log(`[Agent Routing]: TOOL CALLED (search_uploaded_docs) for chat ${chatId}`);
  }
  if (!usedSearch) {
    console.log('[Agent Routing]: DIRECT ANSWER (No search tool needed)');
  }

  return {
    reply: result.output,
    usedSearch,
    sources: usedSearch ? structuredSources : [],
  };
};

export default runAgent;
