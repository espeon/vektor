import {
  env,
  FeatureExtractionPipeline,
  pipeline,
} from "npm:@huggingface/transformers";
import { PostInfo } from "./search/bluesky.ts";

// Configuration for Deno runtime
env.useBrowserCache = false;
env.allowLocalModels = false;

let pipe: FeatureExtractionPipeline | null = null;

async function initializePipeline() {
  if (!pipe) {
    console.log("Initializing pipeline...");
    pipe = await pipeline(
      "feature-extraction",
      "sentence-transformers/all-MiniLM-L6-v2",
    );
  }
}

export async function getEmbeddings(
  texts: PostInfo[] | string[],
): Promise<number[][]> {
  await initializePipeline();

  if (pipe == null) {
    throw new Error("Pipeline not initialized");
  }

  // Handle empty input
  if (texts.length === 0) {
    console.warn(
      "Empty input array provided to getEmbeddings. Returning an empty array of embeddings.",
    );
    return [];
  }

  const processedTexts: string[] = [];

  for (const textOrPost of texts) {
    let text: string | undefined;

    if (
      typeof textOrPost === "object" &&
      textOrPost !== null &&
      "text" in textOrPost &&
      typeof textOrPost.text === "string"
    ) {
      text = textOrPost.text;
    } else if (typeof textOrPost === "string") {
      text = textOrPost;
    }

    if (text && text.trim().length > 0) {
      processedTexts.push(text);
    }
  }

  if (processedTexts.length === 0) {
    console.warn(
      "No valid text found after processing. Returning an empty array of embeddings.",
    );
    return [];
  }

  const embeddings = await Promise.all(
    processedTexts.map(async (text) => {
      if (pipe == null) {
        throw new Error("Pipeline not initialized");
      }
      const output = await pipe(text, {
        pooling: "mean",
        normalize: true,
      });
      return Array.from(output.data);
    }),
  );

  return embeddings as number[][];
}

export async function getEmbeddingsWithOriginal(
  texts: PostInfo[] | string[],
): Promise<[PostInfo | string, number[]][]> {
  await initializePipeline();

  if (pipe == null) {
    throw new Error("Pipeline not initialized");
  }

  // Handle empty input
  if (texts.length === 0) {
    console.warn(
      "Empty input array provided to getEmbeddings. Returning an empty array of embeddings.",
    );
    return [];
  }

  const results: [PostInfo | string, number[]][] = [];

  for (const textOrPost of texts) {
    let text: string | undefined;

    if (
      typeof textOrPost === "object" &&
      textOrPost !== null &&
      "text" in textOrPost &&
      typeof textOrPost.text === "string"
    ) {
      text = textOrPost.text;
    } else if (typeof textOrPost === "string") {
      text = textOrPost;
    }

    if (text && text.trim().length > 0) {
      try {
        if (pipe == null) {
          throw new Error("Pipeline not initialized");
        }
        const output = await pipe(text, {
          pooling: "mean",
          normalize: true,
        });
        const embedding = Array.from(output.data) as number[];
        results.push([textOrPost, embedding]); // Store the original object/string and the embedding
      } catch (error) {
        console.error(`Error processing text: ${text}`, error);
        // Decide how to handle errors:
        // 1.  Skip the item (continue to next one - current behavior).
        // 2.  Re-throw the error, stopping processing.
        // 3.  Return a special value indicating an error for that item (e.g., [textOrPost, null] - or other indicator)
      }
    } else {
      console.warn("Skipping empty or invalid text input."); // Or more specific logging if needed
    }
  }

  return results;
}
