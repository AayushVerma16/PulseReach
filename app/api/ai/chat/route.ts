import { groqClient, createAiTools } from "@/lib/ai/tools";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { OPENAI_TOOLS } from "@/lib/ai/function-defs";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { requireAuth } from "@/lib/auth-guard";
import type {
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

export const maxDuration = 60;

/**
 * Execute a tool call by name, using the user-scoped AI tools.
 */
async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  userId: string
): Promise<string> {
  const tools = createAiTools(userId);

  // Each tool from createAiTools is an AI SDK `tool()` object.
  // Its `.execute` method accepts the validated input.
  const toolMap = tools as Record<
    string,
    { execute?: (input: Record<string, unknown>) => Promise<unknown> }
  >;

  const t = toolMap[toolName];
  if (!t || !t.execute) {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  try {
    const result = await t.execute(args);
    return JSON.stringify(result);
  } catch (err) {
    console.error(`Tool ${toolName} failed:`, err);
    return JSON.stringify({
      error: `Tool execution failed: ${(err as Error).message}`,
    });
  }
}

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      {
        error:
          "GROQ_API_KEY is not configured. Please set it in your .env file.",
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    // AI SDK v6 DefaultChatTransport sends { messages: UIMessage[] }
    // Each UIMessage has { role, parts: [{ type: "text", text: "..." }, ...] }
    const uiMessages: Array<{
      role: string;
      parts?: Array<{ type: string; text?: string }>;
    }> = body.messages || [];

    // Convert UIMessage[] to OpenAI-format messages
    const openAiMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    for (const msg of uiMessages) {
      const role =
        msg.role === "user" ? ("user" as const) : ("assistant" as const);
      const textParts = (msg.parts || [])
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text!)
        .join("\n");

      if (textParts) {
        openAiMessages.push({ role, content: textParts });
      }
    }

    // Use AI SDK v6 UIMessageStream format (SSE with typed chunks)
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // ── First LLM call (may trigger tool calls) ──
        let completion = await groqClient.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: openAiMessages,
          tools: OPENAI_TOOLS,
          tool_choice: "auto",
        });

        let message = completion.choices?.[0]?.message;
        let loopCount = 0;
        const maxLoops = 5; // Safety limit to prevent infinite loops

        // ── Tool call loop ──
        // If the LLM wants to call tools, execute them and feed results back
        while (
          message?.tool_calls &&
          message.tool_calls.length > 0 &&
          loopCount < maxLoops
        ) {
          loopCount++;

          // Add the assistant's tool_calls message to the conversation
          openAiMessages.push({
            role: "assistant",
            content: message.content || null,
            tool_calls: message.tool_calls,
          } as ChatCompletionMessageParam);

          // Execute each tool call and collect results
          for (const toolCall of message.tool_calls) {
            // Groq always returns function-type tool calls
            const tc = toolCall as { id: string; type: string; function: { name: string; arguments: string } };
            const fnName = tc.function.name;
            let fnArgs: Record<string, unknown> = {};

            try {
              fnArgs = JSON.parse(tc.function.arguments || "{}");
            } catch {
              fnArgs = {};
            }

            console.log(`🔧 Tool call: ${fnName}`, fnArgs);
            const result = await executeToolCall(fnName, fnArgs, userId);
            console.log(`✅ Tool result: ${fnName}`, result.slice(0, 200));

            // Add tool result back to conversation
            openAiMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: result,
            } as ChatCompletionMessageParam);
          }

          // Call the LLM again with the tool results
          completion = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: openAiMessages,
            tools: OPENAI_TOOLS,
            tool_choice: "auto",
          });

          message = completion.choices?.[0]?.message;
        }

        // ── Final text response ──
        const assistantText =
          message?.content ||
          "Sorry, I couldn't generate a response. Please try again.";

        const textId = "text-0";
        writer.write({ type: "text-start", id: textId });
        writer.write({ type: "text-delta", id: textId, delta: assistantText });
        writer.write({ type: "text-end", id: textId });
        writer.write({ type: "finish", finishReason: "stop" });
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("AI Chat error:", error);

    const err = error as Error;
    const msg = err.message || "";

    if (
      msg.includes("quota") ||
      msg.includes("rate") ||
      msg.includes("429")
    ) {
      return Response.json(
        { error: "API rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return Response.json(
      { error: err.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
