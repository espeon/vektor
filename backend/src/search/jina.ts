import { JINA_API_URL, JINA_API_KEY } from "../config.ts";

export interface PostInfo {
  uri: string;
  text: string;
}

/**
 * Searches the web using Jina SERP API and formats results as PostInfo objects
 * @param searchTerm The term to search for
 * @param options Optional parameters for the search
 * @returns Promise resolving to an array of PostInfo objects
 */
export async function searchJina(
  searchTerm: string,
  options: {
    gl?: string; // Country code (e.g., 'US')
    hl?: string; // Language (e.g., 'en')
    num?: number; // Number of results (default: 10)
    page?: number; // Page number (default: 1)
  } = {},
): Promise<PostInfo[]> {
  const { gl = "US", hl = "en", num = 10, page = 1 } = options;

  // Build the URL with query parameters
  const url = new URL(JINA_API_URL);
  url.searchParams.append("q", searchTerm);
  url.searchParams.append("gl", gl);
  url.searchParams.append("hl", hl);
  url.searchParams.append("num", num.toString());
  url.searchParams.append("page", page.toString());

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${JINA_API_KEY}`,
        "X-Respond-With": "no-content",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Jina API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Extract the organic search results
    const results = data.data || [];

    // Map the results to PostInfo format
    const postInfoArray: PostInfo[] = results.map((result: any) => {
      return {
        uri: result.url, // Use the link as URI
        text: `${result.title} - ${result.description}`, // Use snippet or title as text
      };
    });

    return postInfoArray;
  } catch (error) {
    console.error("Error searching with Jina SERP API:", error);
    throw error;
  }
}
