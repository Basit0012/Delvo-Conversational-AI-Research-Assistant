import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { searchFileChunks } from '../services/embeddingService.js';

/**
 * Factory to create a LangChain tool for searching documents uploaded to a specific chat.
 * STRICT ISOLATION: The chatId is bound at tool construction time and cannot be overridden by user queries.
 * 
 * @param {Object} options
 * @param {string|import('mongoose').Types.ObjectId} options.chatId - Current chat ID
 * @param {Function} [options.onResults] - Callback to capture matched source chunks
 * @returns {import('@langchain/core/tools').StructuredTool}
 */
export const createDocSearchTool = (options = {}) => {
  const { chatId, onResults } = options;

  if (!chatId) {
    throw new Error('chatId is required to construct a scoped document search tool');
  }

  return tool(
    async ({ query }) => {
      console.log(`[DocSearch Tool]: Searching uploaded docs in chat ${chatId} for: "${query}"`);
      try {
        const results = await searchFileChunks({
          chatId,
          query,
          topK: 4,
          minScore: 0.35,
        });

        if (typeof onResults === 'function') {
          onResults(results, query);
        }

        if (!results || results.length === 0) {
          return 'No relevant passages found in the uploaded documents for this chat.';
        }

        const formatted = results
          .map(
            (r, index) =>
              `[Document Excerpt ${index + 1} - From "${r.fileName}" (Relevance: ${(r.score * 100).toFixed(1)}%)]:\n${r.text}\n`
          )
          .join('\n---\n');

        return formatted;
      } catch (error) {
        console.error(`[DocSearch Tool Error]: ${error.message}`);
        return `Failed to search uploaded documents: ${error.message}`;
      }
    },
    {
      name: 'search_uploaded_docs',
      description:
        'Searches exclusively through documents (PDFs, DOCX, TXT, MD) uploaded by the user to THIS current conversation. Call this whenever the user asks questions about their uploaded file, document, report, or attached data.',
      schema: z.object({
        query: z
          .string()
          .describe('The search query or semantic keywords to look up in the uploaded documents'),
      }),
    }
  );
};

export default createDocSearchTool;
