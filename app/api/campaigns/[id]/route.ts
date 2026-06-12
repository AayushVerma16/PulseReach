import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        segment: {
          select: { name: true, customerCount: true, rules: true },
        },
      },
    });

    if (!campaign || campaign.userId !== userId) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Get message-level breakdown
    const messageCounts = await prisma.message.groupBy({
      by: ["status"],
      where: { campaignId: id },
      _count: { id: true },
    });

    const statusBreakdown = messageCounts.reduce(
      (acc: Record<string, number>, item: { status: string; _count: { id: number } }) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get sample messages
    const sampleMessages = await prisma.message.findMany({
      where: { campaignId: id },
      take: 20,
      orderBy: { updatedAt: "desc" },
      include: {
        customer: {
          select: { name: true, email: true },
        },
      },
    });

    return Response.json({
      campaign,
      statusBreakdown,
      sampleMessages,
    });
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
    return Response.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    const { id } = await params;

    // Verify ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!campaign || campaign.userId !== userId) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Prisma handles cascading deletes for messages if set up that way,
    // otherwise we delete messages first.
    await prisma.message.deleteMany({
      where: { campaignId: id },
    });

    await prisma.campaign.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    return Response.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
