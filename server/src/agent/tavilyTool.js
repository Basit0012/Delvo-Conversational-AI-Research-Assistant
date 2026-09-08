import dotenv from 'dotenv';
dotenv.config();

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { tavily } from '@tavily/core';

/**
 * Factory function to create a Tavily search tool with optional callbacks
 * or default standalone tool instance.
 */
export const createTavilyTool = (options = {}) => {
  const apiKey = options.apiKey || process.env.TAVILY_API_KEY;
  const client = tavily({ apiKey });

  return tool(
    async ({ query }) => {
      console.log(`[Tavily Tool]: Searching web for query: "${query}"`);
      try {
        const response = await client.search(query, {
          maxResults: 5,
        });

        const rawResults = response.results || [];
        const sources = rawResults.map((r) => ({
          title: r.title || 'Untitled',
          url: r.url || '',
          snippet: r.content || '',
        }));

        // Trigger optional callback for capturing structured sources for MongoDB
        if (typeof options.onResults === 'function') {
          options.onResults(sources, query);
        }

        if (sources.length === 0) {
          return 'No web search results found for this query.';
        }

        // Format results as clean, readable text for the LLM
        return sources
          .map(
            (s, index) =>
              `[Source ${index + 1}]:\nTitle: ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}\n`
          )
          .join('\n');
      } catch (error) {
        console.error(`[Tavily Search Error]: ${error.message}`);
        return `Search failed with error: ${error.message}. Please answer using your best existing knowledge without search results, and inform the user that live search was temporarily unavailable.`;
      }
    },
    {
      name: 'tavily_search',
      description:
        'Searches the web for current information. Use only when the question requires information you do not already know or that may have changed recently.',
      schema: z.object({
        query: z.string().describe('The search query string to look up on the web'),
      }),
    }
  );
};

// Default singleton instance
export const tavilyTool = createTavilyTool();
export default tavilyTool;
