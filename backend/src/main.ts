import { Hono } from "hono";
import { cors } from "hono/cors";
import { initializeCollection } from "./qdrant.ts";
import { chatWithRAG, chatWithRAGStream } from "./chat.ts";

const app = new Hono();

app.use(cors());

app.get("/chat", async (c) => {
  const query = c.req.query("q");
  if (!query) return c.text('Query parameter "q" is required', 400);
  const response = await chatWithRAG(query);
  return c.json(response);
});

// Keep existing GET route for backward compatibility
app.get("/chat/stream", async (c) => {
  const query = c.req.query("q");
  if (!query) return c.text('Query parameter "q" is required', 400);

  try {
    const { responseStream, context } = await chatWithRAGStream([
      { role: "user", content: query },
    ]);

    const chatId = "chatcmpl-" + crypto.randomUUID();

    // Create simple passthrough stream
    const encoder = new TextEncoder();

    // Send context and process OpenAI response
    const stream = new ReadableStream({
      async start(controller) {
        // Send the context first
        const contextData =
          "data: " +
          JSON.stringify({ type: "context", data: context, id: chatId }) +
          "\n";
        controller.enqueue(encoder.encode(contextData));

        // Process the OpenAI response stream
        const reader = responseStream.getReader();

        try {
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk and add to buffer
            buffer += new TextDecoder().decode(value);

            // Process lines in buffer
            const lines = buffer.split("\n");
            // Keep last (potentially incomplete) line in buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.substring(6).trim();

                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;

                  if (content) {
                    const tokenData =
                      "data: " +
                      JSON.stringify({
                        type: "token",
                        data: content,
                        id: chatId,
                      }) +
                      "\n";
                    // Properly encode as Uint8Array before enqueueing
                    controller.enqueue(encoder.encode(tokenData));
                  }
                } catch (e) {
                  console.error("Parse error:", e);
                }
              } else {
                if (line.includes("{")) console.log(line);
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Streaming error:", error);
    return c.text("Error processing stream", 500);
  }
});

// Add new POST endpoint for multi-turn conversations
app.post("/chat/stream", async (c) => {
  try {
    const body = await c.req.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages)) {
      return c.text('Valid "messages" array is required', 400);
    }

    const { responseStream, context } = await chatWithRAGStream(messages);

    const chatId = "chatcmpl-" + crypto.randomUUID();

    // Create simple passthrough stream
    const encoder = new TextEncoder();

    // Send context and process OpenAI response
    const stream = new ReadableStream({
      async start(controller) {
        // Send the context first
        const contextData =
          "data: " +
          JSON.stringify({ type: "context", data: context, id: chatId }) +
          "\n";
        controller.enqueue(encoder.encode(contextData));

        // Process the OpenAI response stream
        const reader = responseStream.getReader();

        try {
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk and add to buffer
            buffer += new TextDecoder().decode(value);

            // Process lines in buffer
            const lines = buffer.split("\n");
            // Keep last (potentially incomplete) line in buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.substring(6).trim();

                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n"));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;

                  if (content) {
                    const tokenData =
                      "data: " +
                      JSON.stringify({
                        type: "token",
                        data: content,
                        id: chatId,
                      }) +
                      "\n";
                    // Properly encode as Uint8Array before enqueueing
                    controller.enqueue(encoder.encode(tokenData));
                  }
                } catch (e) {
                  console.error("Parse error:", e);
                }
              } else {
                if (line.includes("{")) console.log(line);
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Streaming error:", error);
    return c.text("Error processing stream", 500);
  }
});

// Initialize collection before starting the server
initializeCollection()
  .then(() => {
    console.log("Collection initialized");
    Deno.serve(app.fetch);
  })
  .catch((error) => {
    console.error("Failed to initialize collection:", error);
    Deno.exit(1);
  });
