import { groqClient } from "@/lib/ai/tools";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

/**
 * POST /api/ai/generate-message
 *
 * Generates a personalized campaign message template using AI.
 * Accepts a natural-language description of the intent (e.g. "win back inactive
 * high-value customers") plus the selected channel, segment context, and optional
 * tone/offer details.  Returns a ready-to-use message template with {{name}} /
 * {{firstName}} personalization tokens.
 */

interface GenerateMessageRequest {
  /** Natural-language description of the message goal */
  prompt: string;
  /** Messaging channel — affects length/format constraints */
  channel: "whatsapp" | "sms" | "email" | "rcs";
  /** Optional segment ID to pull audience context */
  segmentId?: string;
  /** Desired tone */
  tone?: "casual" | "professional" | "urgent" | "friendly" | "playful";
  /** Whether to include a promotional offer */
  includeOffer?: boolean;
  /** Offer details e.g. "20% off", "Free shipping" */
  offerDetails?: string;
}

const CHANNEL_CONSTRAINTS: Record<string, string> = {
  whatsapp:
    "WhatsApp: Keep under 1000 characters. Use emojis sparingly for warmth. Include a clear CTA with a link. Rich text OK.",
  sms: "SMS: Keep under 160 characters. Be extremely concise and direct. Include a short link or code.",
  email:
    "Email: Can be longer and richer. Use a compelling opening line. Clear subject line implied. Paragraph breaks for readability.",
  rcs: "RCS: Rich card format. Include buttons and a hero image description. Keep text concise but engaging.",
};

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: "GROQ_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const body: GenerateMessageRequest = await req.json();
    const { prompt, channel, segmentId, tone, includeOffer, offerDetails } =
      body;

    if (!prompt?.trim() || !channel) {
      return Response.json(
        { error: "prompt and channel are required" },
        { status: 400 }
      );
    }

    // ── Gather audience context if a segment is selected ──
    let segmentContext = "";
    if (segmentId) {
      const segment = await prisma.segment.findUnique({
        where: { id: segmentId },
      });
      if (segment && segment.userId === userId) {
        segmentContext = `\nTarget Audience: "${segment.name}" (${segment.customerCount} customers). Segment rules: ${segment.rules}`;
        if (segment.naturalQuery) {
          segmentContext += `\nOriginal audience description: "${segment.naturalQuery}"`;
        }
      }
    }

    const channelGuide =
      CHANNEL_CONSTRAINTS[channel] || CHANNEL_CONSTRAINTS.whatsapp;
    const toneInstruction = tone
      ? `Tone: ${tone}`
      : "Tone: friendly and professional";
    const offerInstruction =
      includeOffer && offerDetails
        ? `Include this promotional offer prominently: ${offerDetails}`
        : includeOffer
        ? "Include a compelling promotional offer (you can suggest one)"
        : "No specific offer required, but you may hint at value.";

    const systemMessage = `You are an expert D2C marketing copywriter for an Indian retail brand. 
Your job is to generate a single, ready-to-send campaign message template.

RULES:
- Use {{name}} for the customer's full name personalization
- Use {{firstName}} for first-name-only personalization
- ${channelGuide}
- ${toneInstruction}
- ${offerInstruction}
- Write for an Indian D2C audience (amounts in ₹ if needed)
- Include a clear call-to-action
- Do NOT include any explanation, subject lines, or meta-commentary
- Output ONLY the message body text — nothing else
- Make it feel personal and human, not robotic${segmentContext}`;

    const completion = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemMessage },
        {
          role: "user",
          content: `Generate a ${channel} campaign message for: ${prompt}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const generatedMessage =
      completion.choices?.[0]?.message?.content?.trim() || "";

    if (!generatedMessage) {
      return Response.json(
        { error: "AI failed to generate a message. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({
      message: generatedMessage,
      channel,
      tone: tone || "friendly",
    });
  } catch (error) {
    console.error("AI message generation error:", error);
    const err = error as Error;
    if (
      err.message?.includes("quota") ||
      err.message?.includes("rate") ||
      err.message?.includes("429")
    ) {
      return Response.json(
        { error: "API rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }
    return Response.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}
