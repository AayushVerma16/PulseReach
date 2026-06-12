import { NextRequest } from "next/server";
import { z } from "zod";

/**
 * FAKE CHANNEL SERVICE — POST /api/channel/send
 *
 * Simulates a WhatsApp/SMS/Email delivery service.
 *
 * Responsibilities:
 *   1. Receive send request   → { customerId, channel, message }
 *   2. Simulate delivery       → wait a few seconds
 *   3. Send callback to CRM   → POST /api/receipt
 *
 * Example flow:
 *   CRM sends:    { "customerId": "clx...", "message": "20% off" }
 *   After ~5s:    calls /api/receipt → { "customerId": "clx...", "status": "DELIVERED" }
 *   Later:        calls /api/receipt → { "customerId": "clx...", "status": "OPENED" }
 *   Later:        calls /api/receipt → { "customerId": "clx...", "status": "CLICKED" }
 */

const SendRequestSchema = z.object({
  // ── Required fields (public API contract) ──
  customerId: z.string(),
  channel: z.string().optional().default("whatsapp"),
  message: z.string(),

  // ── Internal tracking fields (passed by campaign dispatcher) ──
  vendorId: z.string().optional(),
  messageId: z.string().optional(),
  campaignId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SendRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customerId, channel, message, vendorId, messageId, campaignId } =
      parsed.data;

    const normalizedChannel = channel.toLowerCase();

    console.log(
      `📤 Channel Service received → customer=${customerId} channel=${normalizedChannel} message="${message.slice(0, 80)}${message.length > 80 ? "..." : ""}"`
    );

    // Determine the receipt callback URL (CRM's /api/receipt endpoint)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const receiptUrl = `${appUrl}/api/receipt`;

    // Fire-and-forget: simulate the delivery lifecycle in the background
    simulateDeliveryLifecycle({
      customerId,
      channel: normalizedChannel,
      receiptUrl,
      vendorId,
      messageId,
      campaignId,
    });

    return Response.json({
      status: "accepted",
      customerId,
      channel: normalizedChannel,
      message: `Message queued for delivery via ${normalizedChannel}`,
    });
  } catch {
    return Response.json(
      { error: "Internal channel service error" },
      { status: 500 }
    );
  }
}

/**
 * Simulates the full lifecycle of a message delivery.
 *
 * Timeline:
 *   ~1s  → SENT
 *   ~5s  → DELIVERED (90%) or FAILED (10%)
 *   ~10s → OPENED (60% of delivered)
 *   ~15s → CLICKED (25% of opened)
 *
 * Each status fires a callback to POST /api/receipt with:
 *   { customerId, status: "DELIVERED", ... }
 */
async function simulateDeliveryLifecycle(opts: {
  customerId: string;
  channel: string;
  receiptUrl: string;
  vendorId?: string;
  messageId?: string;
  campaignId?: string;
}) {
  const { customerId, channel, receiptUrl, vendorId, messageId, campaignId } =
    opts;

  const fireReceipt = async (status: string, delay: number) => {
    await new Promise((r) => setTimeout(r, delay));
    try {
      console.log(
        `📬 Channel Service callback → customer=${customerId} status=${status}`
      );
      await fetch(receiptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ── Public callback payload ──
          customerId,
          status,

          // ── Internal tracking (for CRM to update specific records) ──
          ...(vendorId ? { vendorId } : {}),
          ...(messageId ? { messageId } : {}),
          ...(campaignId ? { campaignId } : {}),
          channel,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error(
        `❌ Channel Service callback failed → customer=${customerId} status=${status}`,
        err
      );
    }
  };

  // Step 1: SENT (~1 second)
  await fireReceipt("SENT", randomDelay(500, 1500));

  // Step 2: DELIVERED or FAILED (~5 seconds)
  const deliveryRoll = Math.random();
  if (deliveryRoll < 0.1) {
    // 10% failure rate
    await fireReceipt("FAILED", randomDelay(3000, 5000));
    return; // Terminal state — no further callbacks
  }

  // 90% delivered successfully
  await fireReceipt("DELIVERED", randomDelay(3000, 6000));

  // Step 3: OPENED (60% of delivered, ~10 seconds)
  if (Math.random() < 0.6) {
    await fireReceipt("OPENED", randomDelay(5000, 10000));

    // Step 4: CLICKED (25% of opened, ~15 seconds)
    if (Math.random() < 0.25) {
      await fireReceipt("CLICKED", randomDelay(5000, 12000));
    }
  }
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
