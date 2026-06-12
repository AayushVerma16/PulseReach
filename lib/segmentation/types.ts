import { z } from "zod";

// ----- Operator types -----

export const SegmentOperator = z.enum([
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
]);

export type SegmentOperator = z.infer<typeof SegmentOperator>;

// ----- Supported fields -----

export const SegmentField = z.enum([
  "totalSpend",
  "visitCount",
  "lastVisitAt",
  "createdAt",
  "city",
  "tags",
  "email",
  "name",
]);

export type SegmentField = z.infer<typeof SegmentField>;

// ----- Single condition -----

export const SegmentCondition = z.object({
  field: SegmentField,
  operator: SegmentOperator,
  value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
});

export type SegmentCondition = z.infer<typeof SegmentCondition>;

// ----- Rule group (AND/OR) -----

export const SegmentRuleGroup = z.object({
  logic: z.enum(["AND", "OR"]).default("AND"),
  conditions: z.array(SegmentCondition),
});

export type SegmentRuleGroup = z.infer<typeof SegmentRuleGroup>;

// ----- Full segment rules (array of conditions, implicitly AND) -----

export const SegmentRules = z.union([
  z.array(SegmentCondition), // Simple: array of conditions (AND)
  SegmentRuleGroup,          // Advanced: group with logic
]);

export type SegmentRules = z.infer<typeof SegmentRules>;

// ----- API Schemas -----

export const CreateSegmentInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  rules: z.array(SegmentCondition),
  naturalQuery: z.string().optional(),
});

export type CreateSegmentInput = z.infer<typeof CreateSegmentInput>;

// ----- Message status types -----

export const MessageStatus = z.enum([
  "queued",
  "sent",
  "delivered",
  "failed",
  "opened",
  "clicked",
]);

export type MessageStatus = z.infer<typeof MessageStatus>;

export const CampaignChannel = z.enum(["whatsapp", "sms", "email", "rcs"]);
export type CampaignChannel = z.infer<typeof CampaignChannel>;

export const CampaignStatus = z.enum([
  "draft",
  "sending",
  "sent",
  "completed",
  "failed",
]);
export type CampaignStatus = z.infer<typeof CampaignStatus>;
