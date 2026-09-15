import dotenv from 'dotenv';
dotenv.config();

import { MistralAIEmbeddings } from '@langchain/mistralai';
import FileChunk from '../models/FileChunk.js';

let embeddingsClient = null;

export const getEmbeddingsClient = () => {
  if (!embeddingsClient) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY is not configured for embeddings');
    }
    embeddingsClient = new MistralAIEmbeddings({
      apiKey,
      model: 'mistral-embed',
    });
  }
  return embeddingsClient;
};

/**
 * Generate embedding vector for a single text string
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export const getEmbedding = async (text) => {
  const client = getEmbeddingsClient();
  return client.embedQuery(text);
};

/**
 * Generate embedding vectors for multiple text strings
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export const getEmbeddings = async (texts) => {
  if (!texts || texts.length === 0) return [];
  const client = getEmbeddingsClient();
  return client.embedDocuments(texts);
};

/**
 * Compute cosine similarity between two numeric vectors
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Perform vector similarity search strictly scoped to the specified chatId.
 * GUARANTEE: Never searches across chats or returns chunks belonging to other chats.
 * 
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} options.chatId
 * @param {string} options.query
 * @param {number} [options.topK=4]
 * @param {number} [options.minScore=0.4]
 * @returns {Promise<Array<{ chunkId: string, fileId: string, fileName: string, text: string, score: number, chunkIndex: number }>>}
 */
export const searchFileChunks = async ({ chatId, query, topK = 4, minScore = 0.4 }) => {
  if (!chatId) {
    throw new Error('chatId is strictly required for document search isolation');
  }

  // 1. Fetch chunks belonging ONLY to this chat
  const chunks = await FileChunk.find({ chatId }).lean();
  if (chunks.length === 0) {
    return [];
  }

  // 2. Generate embedding for user query
  const queryVec = await getEmbedding(query);

  // 3. Compute cosine similarity for each chunk
  const scoredChunks = chunks.map((chunk) => {
    const score = cosineSimilarity(queryVec, chunk.embedding);
    return {
      chunkId: chunk._id.toString(),
      fileId: chunk.fileId.toString(),
      fileName: chunk.metadata?.fileName || 'document',
      text: chunk.text,
      chunkIndex: chunk.chunkIndex,
      score,
    };
  });

  // 4. Rank by score descending and take top K
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .filter((c) => c.score >= minScore)
    .slice(0, topK);
};

export default {
  getEmbeddingsClient,
  getEmbedding,
  getEmbeddings,
  cosineSimilarity,
  searchFileChunks,
};
