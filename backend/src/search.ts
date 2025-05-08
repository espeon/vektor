import { client } from './qdrant.ts';
import { getEmbeddings, getEmbeddingsWithOriginal } from './embeddings.ts';
import { fetchBlueskyPosts, PostInfo } from './search/bluesky.ts';
import { generateRelatedQueries } from './openai.ts';
import { COLLECTION_NAME } from './config.ts';
import { Message } from './chat.ts';

const NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

async function uuidv5(
  name: string,
  namespace: string = '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
): Promise<string> {
  // Parse namespace UUID to bytes
  const namespaceBytes = new Uint8Array(16);
  const namespaceHex = namespace.replace(/-/g, '');

  for (let i = 0; i < 16; i++) {
    namespaceBytes[i] = parseInt(namespaceHex.substring(i * 2, i * 2 + 2), 16);
  }

  // Concatenate namespace and name
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name);
  const buffer = new Uint8Array(namespaceBytes.length + nameBytes.length);
  buffer.set(namespaceBytes);
  buffer.set(nameBytes, namespaceBytes.length);

  // Generate SHA-1 hash
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hash = new Uint8Array(hashBuffer);

  // Set UUID version (5) and variant bits
  hash[6] = (hash[6] & 0x0f) | 0x50; // Version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // Variant (RFC 4122)

  // Format as UUID string
  const uuid = [
    hash.subarray(0, 4),
    hash.subarray(4, 6),
    hash.subarray(6, 8),
    hash.subarray(8, 10),
    hash.subarray(10, 16),
  ]
    .map((bytes) =>
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    )
    .join('-');

  return uuid;
}

export async function searchBluesky(
  query: string,
  messagesOrPrompt: string | Message[],
): Promise<PostInfo[]> {
  // Get top 3 related queries
  const relatedQueries = await generateRelatedQueries(
    messagesOrPrompt ?? query,
  );
  const topQueries = [query, ...relatedQueries];

  console.log('Queries:', topQueries);

  const queryEmbedding = await getEmbeddings(topQueries);
  if (queryEmbedding.length === 0) return [];

  // Perform search for each query embedding and collect results
  let searchResults: any[] = [];
  const seenResults = new Set<string>(); // For deduplication

  for (let i = 0; i < queryEmbedding.length; i++) {
    const results = await client.search(COLLECTION_NAME, {
      vector: queryEmbedding[i],
      limit: 10, // Reduce limit per query since we'll aggregate results
      score_threshold: 0.6,
    });

    for (const result of results) {
      const text = result.payload?.text as string;
      if (text && !seenResults.has(text)) {
        seenResults.add(text);
        searchResults.push(result);
      }
    }
  }

  searchResults = searchResults.slice(0, 17);

  const scores = searchResults.map((result) => result.score);
  const avg =
    scores.reduce((acc, score) => acc + score, 0) / scores.length || 0;

  console.log('Average Score:', avg);

  if (avg < 0.89 || searchResults.length < 7) {
    // Use the original query and top 2 related queries for fetching posts
    const searchTerms = topQueries.filter(Boolean);

    const uniquePosts = new Set<PostInfo>();
    for (const q of searchTerms.splice(0, 3)) {
      // Use up to 3 queries (original + 2 related)
      const posts = await fetchBlueskyPosts(q);
      posts.forEach((post) => uniquePosts.add(post));
    }

    if (uniquePosts.size === 0) {
      return [];
    }

    const postTexts = Array.from(uniquePosts);

    const embeddings = await getEmbeddingsWithOriginal(postTexts);

    const points = await Promise.all(
      embeddings.map(async (emb) => ({
        id: await uuidv5(JSON.stringify((emb[0] as PostInfo).text)),
        vector: emb[1],
        payload: { text: emb[0] as string },
      })),
    );

    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    searchResults = await client.search(COLLECTION_NAME, {
      vector: queryEmbedding[0],
      limit: 17,
    });
  }

  return searchResults.map((result) => result.payload?.text).filter(Boolean);
}
