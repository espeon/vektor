import { QdrantClient } from "@qdrant/js-client-rest";
import {
  COLLECTION_NAME,
  DIMENSION,
  QDRANT_API_KEY,
  QDRANT_URL,
} from "./config.ts";

export const client = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

export async function initializeCollection() {
  const collections = await client.getCollections();
  if (collections.collections.some((c) => c.name === COLLECTION_NAME)) {
    await client.deleteCollection(COLLECTION_NAME);
  }

  await client.createCollection(COLLECTION_NAME, {
    vectors: {
      size: DIMENSION,
      distance: "Cosine",
    },
  });

  await client.createPayloadIndex(COLLECTION_NAME, {
    field_name: "text",
    field_schema: "text",
    wait: true,
  });
}
