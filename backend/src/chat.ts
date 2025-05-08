import { searchBluesky } from './search.ts';
import { searchJina } from './search/jina.ts';
import {
  generateChatResponse,
  generateChatResponseStream,
  generateRelatedQueries,
} from './openai.ts';
import { PostInfo } from './search/bluesky.ts';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Define a search source type
type SearchSource = 'bluesky' | 'jina' | 'both';

function formatPosts(posts: string[]): string {
  return posts.map((post, i) => `[${i}] ${JSON.stringify(post)}`).join('\n');
}

// Perform search across specified sources
async function performSearch(
  messagesOrPrompt: string | Message[],
  source: SearchSource = 'both',
): Promise<{
  blueskyResults: PostInfo[];
  jinaResults: PostInfo[];
}> {
  let blueskyResults: PostInfo[] = [];
  let jinaResults: PostInfo[] = [];

  // Get top 3 related queries
  const relatedQueries = await generateRelatedQueries(messagesOrPrompt);
  if (relatedQueries.length === 0) return { blueskyResults, jinaResults };

  const query =
    typeof messagesOrPrompt === 'string'
      ? messagesOrPrompt
      : messagesOrPrompt[messagesOrPrompt.length - 1].content;

  const topQueries = [query, ...relatedQueries];

  if (source === 'bluesky' || source === 'both') {
    blueskyResults = await searchBluesky(topQueries);
  }

  if (source === 'jina' || source === 'both') {
    jinaResults = await searchJina(topQueries[1]);
  }

  return { blueskyResults, jinaResults };
}

export async function chatWithRAG(
  query: string,
  source: SearchSource = 'both',
): Promise<{
  response: string;
  context: PostInfo[];
}> {
  const { blueskyResults, jinaResults } = await performSearch(query, source);

  let allResults = [...blueskyResults, ...jinaResults];

  const prompt = `Using the following search results as context, answer the query: ${query} \nSources: ${formatPosts(allResults.map((post) => JSON.stringify(post)))}`;

  if (blueskyResults.length === 0 && jinaResults.length === 0) {
    return {
      response: await generateChatResponse(query),
      context: allResults,
    };
  }

  return {
    response: await generateChatResponse(prompt),
    context: allResults,
  };
}

export async function chatWithRAGStream(
  messages: Message[],
  source: SearchSource = 'both',
): Promise<{
  responseStream: ReadableStream;
  context: PostInfo[];
}> {
  const { blueskyResults, jinaResults } = await performSearch(messages, source);

  let allResults = [...blueskyResults, ...jinaResults];

  const contextMessage = `Sources: ${formatPosts(allResults.map((post) => JSON.stringify(post)))}`;

  let augmentedMessages = [...messages];

  // Add the search results as context in a system message before the last user message
  let lastUserIndex = -1;
  for (let i = augmentedMessages.length - 1; i >= 0; i--) {
    if (augmentedMessages[i].role === 'user') {
      lastUserIndex = i;
      break;
    }
  }

  if (lastUserIndex >= 0 && contextMessage) {
    // Insert system message with context right before the last user message
    augmentedMessages.splice(lastUserIndex, 0, {
      role: 'system',
      content: `Search results for the user's next query:\n${contextMessage}`,
    });
  }

  return {
    responseStream: await generateChatResponseStream(augmentedMessages),
    context: allResults,
  };
}
