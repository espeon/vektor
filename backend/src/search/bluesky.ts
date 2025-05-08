// deno-lint-ignore-file no-explicit-any
export interface BlueskyPost {
  uri: string;
  cid: string;
  author: {
    did: string;
    handle: string;
    displayName: string;
    avatar: string;
    associated?: { chat: any }[]; // Assuming the chat can have any type of value
    labels?: { [key: string]: any }[];
    createdAt: string;
  };
  record: {
    $type: string;
    createdAt: string;
    langs?: string[];
    reply?: {
      parent?: { [key: string]: any };
      root?: { [key: string]: any };
    };
    text: string;
    embed?: { [key: string]: any };
    facets?: { [key: string]: any }[]; // for Google
    tags?: string[]; // Added
  };
  replyCount: number;
  repostCount: number;
  likeCount: number;
  quoteCount: number;
  indexedAt: string;
  labels?: { [key: string]: any }[];
  embed?: { [key: string]: any }; //added embed
  threadgate?: {
    uri: string;
    cid: string;
    record: {
      $type: string;
      allow: string[];
      createdAt: string;
      hiddenReplies: any[];
      post: string;
    };
    lists: any[];
  }; // added threadgate
}

export interface BlueskySearchPostsResponse {
  posts?: BlueskyPost[];
}

export interface PostInfo {
  uri: string;
  text: string;
}

const TERMS_TO_IGNORE = [
  "No explanations",
  "for 20 days",
  "top 10",
  "top 5",
  "AI generated",
  "travel guide",
  "travel booking portal",
  "tour guide",
]
  .map((term) => '-"' + term.toLowerCase() + '"')
  .join(" ");

export async function fetchBlueskyPosts(
  query: string,
  limit: number = 50,
): Promise<PostInfo[]> {
  console.log("Fetching Bluesky posts...");
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${
    encodeURIComponent(query) + " " + TERMS_TO_IGNORE
  }&limit=${limit}&sort=top`;
  try {
    const response = await fetch(url);
    const data: BlueskySearchPostsResponse = await response.json();
    return (
      (data.posts
        ?.map((post) => {
          if (post && post.record && post.record.text && post.uri) {
            // get alt text if available
            const altText = post.record.embed?.images?.[0]?.alt;
            // get embed info if available
            const embedInfo = post.record.embed;

            // format post text
            let postText = post.record.text;
            if (altText) {
              postText += `\n\nAlt Text: ${altText}`;
            }
            if (embedInfo) {
              postText += `\n\nEmbed Info: ${JSON.stringify(embedInfo)}`;
            }
            return {
              uri: post.uri,
              text: postText,
            } as PostInfo;
          }
          return [];
        })
        .filter(Boolean) as PostInfo[]) || []
    );
  } catch (error) {
    console.error("Error fetching Bluesky posts:", error);
    return [];
  }
}
