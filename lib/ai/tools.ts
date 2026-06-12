import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  previewSegmentCount,
  previewSegmentCustomers,
} from "@/lib/segmentation/engine";
import type { SegmentCondition } from "@/lib/segmentation/types";
import { dispatchCampaign } from "@/lib/channel-service/dispatcher";

import OpenAI from "openai";

export const groqClient = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * AI tools exposed to the LLM via Vercel AI SDK function calling.
 * These let the AI take real CRM actions during a chat conversation.
 *
 * AI SDK v6 uses `inputSchema` (not `parameters`) and
 * `execute(input, options)` (not destructured params).
 *
 * All tools are scoped to a specific user via the userId parameter
 * passed to the createAiTools factory function.
 */

// Reusable schemas
const segmentRuleSchema = z.object({
  field: z.enum([
    "totalSpend",
    "visitCount",
    "lastVisitAt",
    "createdAt",
    "city",
    "tags",
    "email",
    "name",
  ]),
  operator: z.enum([
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
    "in",
    "notIn",
    "contains",
    "before",
    "after",
    "hasTag",
    "notHasTag",
  ]),
  value: z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
    z.array(z.number()),
  ]),
});

/**
 * Factory function that creates AI tools scoped to a specific user.
 */
export function createAiTools(userId: string) {
  return {
    createSegment: tool({
      description:
        "Create a new customer audience segment from structured filter rules. Returns the segment ID and matching customer count.",
      inputSchema: z.object({
        name: z.string().describe("Human-readable segment name"),
        description: z
          .string()
          .optional()
          .describe("Brief description of the segment"),
        rules: z
          .array(segmentRuleSchema)
          .describe("Array of filter conditions (combined with AND logic)"),
        naturalQuery: z
          .string()
          .optional()
          .describe("The original natural language query from the user"),
      }),
      execute: async (input) => {
        const conditions = input.rules as SegmentCondition[];
        const customerCount = await previewSegmentCount(conditions, userId);

        const segment = await prisma.segment.create({
          data: {
            userId,
            name: input.name,
            description: input.description,
            rules: JSON.stringify(input.rules),
            naturalQuery: input.naturalQuery,
            customerCount,
          },
        });

        return {
          segmentId: segment.id,
          name: segment.name,
          customerCount,
          rules: input.rules,
        };
      },
    }),

    previewSegment: tool({
      description:
        "Preview how many customers match a set of segment rules, and return a sample of matching customers.",
      inputSchema: z.object({
        rules: z
          .array(segmentRuleSchema)
          .describe("Array of filter conditions to preview"),
      }),
      execute: async (input) => {
        const conditions = input.rules as SegmentCondition[];
        const preview = await previewSegmentCustomers(conditions, 5, userId);
        return {
          totalMatching: preview.count,
          sampleCustomers: preview.customers.map((c: { name: string; city: string | null; totalSpend: number; visitCount: number; tags: string[] }) => ({
            name: c.name,
            city: c.city,
            totalSpend: c.totalSpend,
            visitCount: c.visitCount,
            tags: c.tags,
          })),
        };
      },
    }),

    draftMessage: tool({
      description:
        "Generate a personalized message template for a campaign. Actually generates a ready-to-use message using AI.",
      inputSchema: z.object({
        channel: z
          .enum(["whatsapp", "sms", "email", "rcs"])
          .describe("The messaging channel"),
        tone: z
          .enum(["casual", "professional", "urgent", "friendly", "playful"])
          .describe("The tone of the message"),
        goal: z.string().describe("The marketing goal or offer details"),
        includeOffer: z
          .boolean()
          .optional()
          .describe("Whether to include a promotional offer"),
        offerDetails: z
          .string()
          .optional()
          .describe("Details of the offer (e.g., '20% off', 'Free shipping')"),
      }),
      execute: async (input) => {
        const channelGuide: Record<string, string> = {
          whatsapp: "WhatsApp: Keep under 1000 chars. Use emojis sparingly. Include a clear CTA with a link.",
          sms: "SMS: Keep under 160 chars. Be extremely concise and direct. Include a short link or code.",
          email: "Email: Can be longer. Use a compelling opening line. Clear paragraph breaks.",
          rcs: "RCS: Rich card format. Include buttons. Keep text concise but engaging.",
        };

        const offerInstruction =
          input.includeOffer && input.offerDetails
            ? `Include this promotional offer prominently: ${input.offerDetails}`
            : input.includeOffer
            ? "Include a compelling promotional offer"
            : "No specific offer required.";

        try {
          const completion = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: `You are an expert D2C marketing copywriter for an Indian retail brand.
Generate a single, ready-to-send campaign message template.
RULES:
- Use {{name}} for the customer's full name personalization
- Use {{firstName}} for first-name-only personalization
- ${channelGuide[input.channel]}
- Tone: ${input.tone}
- ${offerInstruction}
- Write for an Indian D2C audience (amounts in ₹ if needed)
- Include a clear call-to-action
- Do NOT include any explanation or meta-commentary
- Output ONLY the message body text — nothing else`,
              },
              {
                role: "user",
                content: `Generate a ${input.channel} campaign message for: ${input.goal}`,
              },
            ],
            temperature: 0.8,
            max_tokens: 500,
          });

          const generatedMessage =
            completion.choices?.[0]?.message?.content?.trim() || "";

          return {
            channel: input.channel,
            tone: input.tone,
            goal: input.goal,
            generatedMessage,
            personalizationTokens: ["{{name}}", "{{firstName}}"],
          };
        } catch (err) {
          console.error("draftMessage AI generation failed:", err);
          return {
            channel: input.channel,
            tone: input.tone,
            goal: input.goal,
            generatedMessage: null,
            error: "Failed to generate message. Please try again.",
            personalizationTokens: ["{{name}}", "{{firstName}}"],
          };
        }
      },
    }),

    launchCampaign: tool({
      description:
        "Create and immediately launch a campaign, sending messages to all customers in a segment.",
      inputSchema: z.object({
        name: z.string().describe("Campaign name"),
        segmentId: z.string().describe("ID of the target segment"),
        channel: z
          .enum(["whatsapp", "sms", "email", "rcs"])
          .describe("Messaging channel"),
        messageTemplate: z
          .string()
          .describe(
            "Message template with {{name}}/{{firstName}} placeholders"
          ),
      }),
      execute: async (input) => {
        // Verify segment exists and belongs to user
        const segment = await prisma.segment.findUnique({
          where: { id: input.segmentId },
        });
        if (!segment || segment.userId !== userId) {
          return { error: "Segment not found", segmentId: input.segmentId };
        }

        // Create the campaign
        const campaign = await prisma.campaign.create({
          data: {
            userId,
            name: input.name,
            segmentId: input.segmentId,
            channel: input.channel,
            messageTemplate: input.messageTemplate,
            status: "sending",
          },
        });

        // Fire-and-forget dispatch
        dispatchCampaign(campaign.id).catch((err) => {
          console.error(`Campaign ${campaign.id} dispatch failed:`, err);
        });

        return {
          campaignId: campaign.id,
          name: input.name,
          channel: input.channel,
          segmentName: segment.name,
          targetCustomers: segment.customerCount,
          status: "sending",
          message:
            "Campaign launched! Messages are being sent. Ask me for stats in a minute.",
        };
      },
    }),

    getCampaignStats: tool({
      description:
        "Get delivery performance stats for a specific campaign.",
      inputSchema: z.object({
        campaignId: z.string().describe("The campaign ID to get stats for"),
      }),
      execute: async (input) => {
        const campaign = await prisma.campaign.findUnique({
          where: { id: input.campaignId },
          include: {
            segment: { select: { name: true } },
          },
        });

        if (!campaign || campaign.userId !== userId) {
          return { error: "Campaign not found" };
        }

        const deliveryRate =
          campaign.totalMessages > 0
            ? ((campaign.deliveredCount / campaign.totalMessages) * 100).toFixed(1)
            : "0";

        const openRate =
          campaign.deliveredCount > 0
            ? ((campaign.openedCount / campaign.deliveredCount) * 100).toFixed(1)
            : "0";

        const clickRate =
          campaign.openedCount > 0
            ? ((campaign.clickedCount / campaign.openedCount) * 100).toFixed(1)
            : "0";

        return {
          campaignId: campaign.id,
          name: campaign.name,
          segment: campaign.segment.name,
          channel: campaign.channel,
          status: campaign.status,
          stats: {
            total: campaign.totalMessages,
            sent: campaign.sentCount,
            delivered: campaign.deliveredCount,
            failed: campaign.failedCount,
            opened: campaign.openedCount,
            clicked: campaign.clickedCount,
          },
          rates: {
            delivery: `${deliveryRate}%`,
            open: `${openRate}%`,
            click: `${clickRate}%`,
          },
          sentAt: campaign.sentAt,
        };
      },
    }),

    getCustomerInsights: tool({
      description:
        "Get a summary of the customer base — total count, spending distribution, tag breakdown, etc.",
      inputSchema: z.object({}),
      execute: async () => {
        const [
          totalCustomers,
          totalOrders,
          spendStats,
          tagCounts,
          topCities,
        ] = await Promise.all([
          prisma.customer.count({ where: { userId } }),
          prisma.order.count({ where: { customer: { userId } } }),
          prisma.customer.aggregate({
            where: { userId },
            _avg: { totalSpend: true },
            _max: { totalSpend: true },
            _min: { totalSpend: true },
            _sum: { totalSpend: true },
          }),
          // Count customers by common tags
          Promise.all(
            [
              "high-value",
              "mid-value",
              "low-value",
              "churned",
              "active",
              "at-risk",
              "loyal",
              "new",
            ].map(async (tag) => ({
              tag,
              count: await prisma.customer.count({
                where: { userId, tags: { has: tag } },
              }),
            }))
          ),
          // Top 5 cities
          prisma.customer.groupBy({
            by: ["city"],
            where: { userId },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 5,
          }),
        ]);

        return {
          totalCustomers,
          totalOrders,
          spending: {
            average: Math.round(spendStats._avg.totalSpend || 0),
            highest: Math.round(spendStats._max.totalSpend || 0),
            total: Math.round(spendStats._sum.totalSpend || 0),
          },
          segments: tagCounts,
          topCities: topCities.map((c: { city: string | null; _count: { id: number } }) => ({
            city: c.city,
            customers: c._count.id,
          })),
        };
      },
    }),

    listCampaigns: tool({
      description: "List recent campaigns with their status and basic stats.",
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .default(5)
          .describe("Number of campaigns to return"),
      }),
      execute: async (input) => {
        const campaigns = await prisma.campaign.findMany({
          where: { userId },
          take: input.limit,
          orderBy: { createdAt: "desc" },
          include: {
            segment: { select: { name: true } },
          },
        });

        return {
          campaigns: campaigns.map((c: { id: string; name: string; segment: { name: string }; channel: string; status: string; totalMessages: number; deliveredCount: number; openedCount: number; createdAt: Date }) => ({
            id: c.id,
            name: c.name,
            segment: c.segment.name,
            channel: c.channel,
            status: c.status,
            totalMessages: c.totalMessages,
            delivered: c.deliveredCount,
            opened: c.openedCount,
            createdAt: c.createdAt,
          })),
        };
      },
    }),

    listSegments: tool({
      description: "List all existing customer segments.",
      inputSchema: z.object({}),
      execute: async () => {
        const segments = await prisma.segment.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        return {
          segments: segments.map((s: { id: string; name: string; description: string | null; customerCount: number; createdAt: Date }) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            customerCount: s.customerCount,
            createdAt: s.createdAt,
          })),
        };
      },
    }),
  };
}

// Keep backwards compatibility — export default tools without userId for non-auth contexts
export const aiTools = createAiTools("");
