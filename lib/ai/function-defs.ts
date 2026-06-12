/**
 * OpenAI-compatible function definitions for Groq function calling.
 *
 * These mirror the tools in tools.ts but are formatted as
 * OpenAI ChatCompletionTool objects that Groq's API accepts.
 */

import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const OPENAI_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "createSegment",
      description:
        "Create a new customer audience segment from structured filter rules. Returns the segment ID and matching customer count. Use this when the user asks you to create or save a segment.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Human-readable segment name",
          },
          description: {
            type: "string",
            description: "Brief description of the segment",
          },
          rules: {
            type: "array",
            description:
              "Array of filter conditions (combined with AND logic)",
            items: {
              type: "object",
              properties: {
                field: {
                  type: "string",
                  enum: [
                    "totalSpend",
                    "visitCount",
                    "lastVisitAt",
                    "createdAt",
                    "city",
                    "tags",
                    "email",
                    "name",
                  ],
                },
                operator: {
                  type: "string",
                  enum: [
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
                  ],
                },
                value: {
                  description:
                    'The value to compare against. Can be string, number, or array. For date fields, use relative formats like "30_days_ago", "90_days_ago".',
                },
              },
              required: ["field", "operator", "value"],
            },
          },
          naturalQuery: {
            type: "string",
            description: "The original natural language query from the user",
          },
        },
        required: ["name", "rules"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "previewSegment",
      description:
        "Preview how many customers match a set of segment rules, and return a sample of matching customers. Use this BEFORE creating a segment to show the user how many customers would be targeted.",
      parameters: {
        type: "object",
        properties: {
          rules: {
            type: "array",
            description: "Array of filter conditions to preview",
            items: {
              type: "object",
              properties: {
                field: {
                  type: "string",
                  enum: [
                    "totalSpend",
                    "visitCount",
                    "lastVisitAt",
                    "createdAt",
                    "city",
                    "tags",
                    "email",
                    "name",
                  ],
                },
                operator: {
                  type: "string",
                  enum: [
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
                  ],
                },
                value: {
                  description: "The value to compare against.",
                },
              },
              required: ["field", "operator", "value"],
            },
          },
        },
        required: ["rules"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draftMessage",
      description:
        "Generate a personalized message template for a campaign.",
      parameters: {
        type: "object",
        properties: {
          channel: {
            type: "string",
            enum: ["whatsapp", "sms", "email", "rcs"],
            description: "The messaging channel",
          },
          tone: {
            type: "string",
            enum: ["casual", "professional", "urgent", "friendly", "playful"],
            description: "The tone of the message",
          },
          goal: {
            type: "string",
            description: "The marketing goal or offer details",
          },
          includeOffer: {
            type: "boolean",
            description: "Whether to include a promotional offer",
          },
          offerDetails: {
            type: "string",
            description:
              "Details of the offer (e.g., '20% off', 'Free shipping')",
          },
        },
        required: ["channel", "tone", "goal"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "launchCampaign",
      description:
        "Create and immediately launch a campaign, sending messages to all customers in a segment.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Campaign name" },
          segmentId: {
            type: "string",
            description: "ID of the target segment",
          },
          channel: {
            type: "string",
            enum: ["whatsapp", "sms", "email", "rcs"],
            description: "Messaging channel",
          },
          messageTemplate: {
            type: "string",
            description:
              "Message template with {{name}}/{{firstName}} placeholders",
          },
        },
        required: ["name", "segmentId", "channel", "messageTemplate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCampaignStats",
      description:
        "Get delivery performance stats for a specific campaign.",
      parameters: {
        type: "object",
        properties: {
          campaignId: {
            type: "string",
            description: "The campaign ID to get stats for",
          },
        },
        required: ["campaignId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCustomerInsights",
      description:
        "Get a summary of the customer base — total count, spending distribution, tag breakdown, etc.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listCampaigns",
      description:
        "List recent campaigns with their status and basic stats.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of campaigns to return (default 5)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listSegments",
      description: "List all existing customer segments.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];
