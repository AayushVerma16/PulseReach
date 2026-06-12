import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { dispatchCampaign } from "@/lib/channel-service/dispatcher";
import { requireAuth } from "@/lib/auth-guard";

const CreateCampaignInput = z.object({
  name: z.string().min(1).max(200),
  segmentId: z.string(),
  channel: z.enum(["whatsapp", "sms", "email", "rcs"]),
  messageTemplate: z.string().min(1),
  launch: z.boolean().default(false), // If true, immediately dispatch
});

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where = { userId, ...(status ? { status } : {}) };

    const campaigns = await prisma.campaign.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        segment: {
          select: { name: true, customerCount: true },
        },
      },
    });

    return Response.json({ campaigns });
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return Response.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    const body = await request.json();
    const parsed = CreateCampaignInput.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, segmentId, channel, messageTemplate, launch } = parsed.data;

    // Verify segment exists and belongs to user
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });
    if (!segment || segment.userId !== userId) {
      return Response.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name,
        segmentId,
        channel,
        messageTemplate,
        status: launch ? "sending" : "draft",
      },
    });

    // If launch is true, dispatch in the background
    if (launch) {
      // Fire-and-forget dispatch — don't await it
      dispatchCampaign(campaign.id).catch((err) => {
        console.error(`Campaign ${campaign.id} dispatch failed:`, err);
      });
    }

    return Response.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return Response.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
