import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  isValidTransition,
  getTimestampField,
  getCampaignCounterField,
} from "@/lib/channel-service/status-machine";

/**
 * CRM RECEIPT ENDPOINT — POST /api/receipt
 *
 * Receives delivery status callbacks from the Channel Service.
 *
 * The Channel Service calls this endpoint as messages progress through
 * the delivery lifecycle:
 *
 *   { "customerId": "clx...", "status": "DELIVERED" }
 *   { "customerId": "clx...", "status": "OPENED" }
 *   { "customerId": "clx...", "status": "CLICKED" }
 *
 * This endpoint:
 *   1. Finds the matching message record
 *   2. Updates the message status (idempotent, no regressions)
 *   3. Updates the campaign aggregate statistics
 *   4. Marks campaigns as completed when all messages are processed
 */

const ReceiptSchema = z.object({
  // ── Public fields (from channel service callback) ──
  customerId: z.string(),
  status: z.enum(["SENT", "DELIVERED", "FAILED", "OPENED", "CLICKED"]),

  // ── Internal tracking fields (passed through by channel service) ──
  vendorId: z.string().optional(),
  messageId: z.string().optional(),
  campaignId: z.string().optional(),
  channel: z.string().optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ReceiptSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid receipt payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      customerId,
      status: rawStatus,
      vendorId,
      messageId,
      campaignId,
      timestamp,
    } = parsed.data;

    // Normalize status to lowercase (internal DB uses lowercase)
    const status = rawStatus.toLowerCase();

    console.log(
      `📩 Receipt → customer=${customerId} status=${rawStatus} vendorId=${vendorId || "n/a"}`
    );

    // ── Find the message record ──
    // Try vendorId first (most specific), then messageId, then fall back to
    // customerId + campaignId lookup
    let message = null;

    if (vendorId) {
      message = await prisma.message.findUnique({ where: { vendorId } });
    }

    if (!message && messageId) {
      message = await prisma.message.findUnique({ where: { id: messageId } });
    }

    if (!message && campaignId) {
      // Fall back: find the most recent queued/sent message for this customer
      // in this campaign
      message = await prisma.message.findFirst({
        where: {
          customerId,
          campaignId,
          status: { not: "failed" },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!message) {
      console.log(
        `⚠️ Receipt ignored — no matching message for customer=${customerId}`
      );
      return Response.json({
        status: "ignored",
        reason: "no_matching_message",
        customerId,
      });
    }

    // ── Validate state transition ──
    if (!isValidTransition(message.status, status)) {
      return Response.json({
        status: "ignored",
        reason: "invalid_transition",
        currentStatus: message.status,
        attemptedStatus: rawStatus,
      });
    }

    // ── Update the message record ──
    const timestampField = getTimestampField(status);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (timestampField && timestamp) {
      updateData[timestampField] = new Date(timestamp);
    } else if (timestampField) {
      updateData[timestampField] = new Date();
    }

    if (status === "failed") {
      updateData.failReason = "Delivery failed (reported by channel service)";
    }

    // Append to status log
    const currentLog = Array.isArray(message.statusLog)
      ? message.statusLog
      : [];
    updateData.statusLog = [
      ...currentLog,
      {
        status: rawStatus,
        timestamp: timestamp || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      },
    ];

    await prisma.message.update({
      where: { id: message.id },
      data: updateData,
    });

    // ── Update campaign aggregate counters ──
    const counterField = getCampaignCounterField(status);
    const msgCampaignId = campaignId || message.campaignId;

    if (counterField && msgCampaignId) {
      await prisma.campaign.update({
        where: { id: msgCampaignId },
        data: {
          [counterField]: { increment: 1 },
        },
      });

      // Check if all messages are in terminal states → mark campaign completed
      if (status === "delivered" || status === "failed") {
        const refreshed = await prisma.campaign.findUnique({
          where: { id: msgCampaignId },
          select: {
            totalMessages: true,
            deliveredCount: true,
            failedCount: true,
          },
        });

        if (
          refreshed &&
          refreshed.deliveredCount + refreshed.failedCount >=
            refreshed.totalMessages
        ) {
          await prisma.campaign.update({
            where: { id: msgCampaignId },
            data: { status: "completed" },
          });
        }
      }
    }

    return Response.json({
      status: "processed",
      customerId,
      newStatus: rawStatus,
      messageId: message.id,
    });
  } catch (error) {
    console.error("Receipt processing error:", error);
    return Response.json(
      { error: "Receipt processing failed" },
      { status: 500 }
    );
  }
}
