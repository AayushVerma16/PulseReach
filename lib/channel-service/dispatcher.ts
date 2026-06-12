import { prisma } from "@/lib/prisma";
import { buildWhereClause } from "@/lib/segmentation/engine";
import type { SegmentCondition } from "@/lib/segmentation/types";
import { v4 as uuidv4 } from "uuid";

const BATCH_SIZE = 50;
const MAX_RETRIES = 3;

/**
 * Dispatch a campaign: fetch segment customers, personalize messages,
 * send them through the stubbed channel service, and track results.
 */
export async function dispatchCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { segment: true },
  });

  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  // Parse segment rules
  const rules = (
    typeof campaign.segment.rules === "string"
      ? JSON.parse(campaign.segment.rules)
      : campaign.segment.rules
  ) as SegmentCondition[];

  // Get matching customers scoped to the campaign owner's userId
  const where = buildWhereClause(rules, campaign.userId);
  const customers = await prisma.customer.findMany({
    where,
    select: { id: true, name: true, email: true, phone: true },
  });

  // Update campaign status
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "sending",
      sentAt: new Date(),
      totalMessages: customers.length,
    },
  });

  // Create Message records in bulk
  const messageRecords = customers.map((customer: { id: string; name: string; email: string; phone: string | null }) => ({
    campaignId,
    customerId: customer.id,
    channel: campaign.channel,
    content: personalizeMessage(campaign.messageTemplate, customer),
    status: "queued" as const,
    vendorId: uuidv4(),
    statusLog: JSON.stringify([]),
  }));

  // Insert in batches
  for (let i = 0; i < messageRecords.length; i += 500) {
    await prisma.message.createMany({
      data: messageRecords.slice(i, i + 500),
    });
  }

  // Fetch created messages to get IDs
  const messages = await prisma.message.findMany({
    where: { campaignId },
    select: { id: true, vendorId: true, content: true, customerId: true },
  });

  // Send messages in batches through the channel service
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let sentCount = 0;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    const sendPromises = batch.map(async (msg: { id: string; vendorId: string | null; content: string; customerId: string }) => {
      let attempts = 0;
      while (attempts < MAX_RETRIES) {
        try {
          const resp = await fetch(`${appUrl}/api/channel/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // ── Public API contract (what channel service expects) ──
              customerId: msg.customerId,
              channel: campaign.channel,
              message: msg.content,

              // ── Internal tracking (passed through to /api/receipt) ──
              vendorId: msg.vendorId,
              messageId: msg.id,
              campaignId,
            }),
          });

          if (resp.ok) {
            sentCount++;
            return;
          }

          attempts++;
          if (attempts < MAX_RETRIES) {
            // Exponential backoff
            await new Promise((r) =>
              setTimeout(r, Math.pow(2, attempts) * 100)
            );
          }
        } catch {
          attempts++;
          if (attempts < MAX_RETRIES) {
            await new Promise((r) =>
              setTimeout(r, Math.pow(2, attempts) * 100)
            );
          }
        }
      }

      // All retries exhausted — mark as failed
      await prisma.message.update({
        where: { id: msg.id },
        data: {
          status: "failed",
          failReason: "Channel service unreachable after retries",
        },
      });
    });

    await Promise.all(sendPromises);
  }

  // Update campaign with sent count
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      sentCount,
      status: sentCount === 0 ? "failed" : "sent",
    },
  });
}

/**
 * Personalize a message template with customer data.
 */
function personalizeMessage(
  template: string,
  customer: { name: string; email: string; phone?: string | null }
): string {
  return template
    .replace(/\{\{name\}\}/gi, customer.name)
    .replace(/\{\{email\}\}/gi, customer.email)
    .replace(/\{\{phone\}\}/gi, customer.phone || "")
    .replace(/\{\{firstName\}\}/gi, customer.name.split(" ")[0]);
}
