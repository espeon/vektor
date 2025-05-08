import "jsr:@std/dotenv/load";

console.log("Loading env variables:", Deno.env.get("QDRANT_URL"));

export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
export const OPENAI_URL =
  Deno.env.get("OPENAI_URL") || "https://chatapi.akash.network/api/v1";
export const DIMENSION = parseInt(Deno.env.get("DIMENSION") || "384"); // GTE-small dimension
export const COLLECTION_NAME =
  Deno.env.get("COLLECTION_NAME") || "bluesky_posts";
export const QDRANT_URL = Deno.env.get("QDRANT_URL") || "";
export const QDRANT_API_KEY = Deno.env.get("QDRANT_API_KEY") || "";
export const JINA_API_URL =
  Deno.env.get("JINA_API_URL") || "https://s.jina.ai/";
export const JINA_API_KEY = Deno.env.get("JINA_API_KEY") || "";
