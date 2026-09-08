import dotenv from 'dotenv';
dotenv.config();

import { ChatMistralAI } from '@langchain/mistralai';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

import { createTavilyTool } from './tavilyTool.js';
import Message from '../models/Message.js';

// Model selection: defaults to codestral-latest or mistral-medium if configured
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'codestral-latest';

const SYSTEM_PROMPT = `You are Delvo, an intelligent AI research assistant.
You have access to a web search tool called "tavily_search".

CRITICAL ROUTING INSTRUCTIONS:
1. Call "tavily_search" ONLY when the user's question explicitly or implicitly requires current, real-time, recent news/events, or external web facts that you do not already know.
2. If the question is about general knowledge, coding, math, historical facts, logical reasoning, or something already discussed in the conversation history, DO NOT call the search tool. Answer directly.
3. When you use search results, synthesize them clearly and cite facts accurately.`;

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

  // Create a tool instance with callback to capture structured source metadata
  const searchTool = createTavilyTool({
    onResults: (sources) => {
      structuredSources = sources;
    },
  });

  const tools = [searchTool];

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
    const dbMessages = await fetchChatHistoryFromDB(chatId, 10);
    history = formatChatHistory(dbMessages);
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
  const usedSearch = searchSteps.length > 0;

  // Visual visibility logging required by specification
  if (usedSearch) {
    console.log(
      `[Agent Routing]: TOOL CALLED (tavily_search) -> Found ${structuredSources.length} sources`
    );
  } else {
    console.log('[Agent Routing]: DIRECT ANSWER (No search tool needed)');
  }

  return {
    reply: result.output,
    usedSearch,
    sources: usedSearch ? structuredSources : [],
  };
};

export default runAgent;
