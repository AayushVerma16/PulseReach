import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    const [
      totalCustomers,
      totalOrders,
      totalCampaigns,
      totalSegments,
      totalMessages,
      spendStats,
      tagCounts,
      topCities,
      recentCampaigns,
      channelBreakdown,
      deliveryStats,
    ] = await Promise.all([
      prisma.customer.count({ where: { userId } }),
      prisma.order.count({ where: { customer: { userId } } }),
      prisma.campaign.count({ where: { userId } }),
      prisma.segment.count({ where: { userId } }),
      prisma.message.count({ where: { campaign: { userId } } }),
      prisma.customer.aggregate({
        where: { userId },
        _avg: { totalSpend: true },
        _sum: { totalSpend: true },
        _max: { totalSpend: true },
      }),
      // Tag distribution
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
          "one-time",
        ].map(async (tag) => ({
          tag,
          count: await prisma.customer.count({
            where: { userId, tags: { has: tag } },
          }),
        }))
      ),
      // Top cities
      prisma.customer.groupBy({
        by: ["city"],
        where: { userId },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 6,
      }),
      // Recent campaigns with stats
      prisma.campaign.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          segment: { select: { name: true } },
        },
      }),
      // Channel breakdown
      prisma.campaign.groupBy({
        by: ["channel"],
        where: { userId },
        _count: { id: true },
        _sum: { totalMessages: true, deliveredCount: true },
      }),
      // Aggregate delivery stats
      prisma.campaign.aggregate({
        where: { userId },
        _sum: {
          totalMessages: true,
          sentCount: true,
          deliveredCount: true,
          failedCount: true,
          openedCount: true,
          clickedCount: true,
        },
      }),
    ]);

    const totalDelivered = deliveryStats._sum.deliveredCount || 0;
    const totalSent = deliveryStats._sum.totalMessages || 0;
    const avgDeliveryRate =
      totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
    const avgOpenRate =
      totalDelivered > 0
        ? Math.round(
            ((deliveryStats._sum.openedCount || 0) / totalDelivered) * 100
          )
        : 0;

    return Response.json({
      metrics: {
        totalCustomers,
        totalOrders,
        totalCampaigns,
        totalSegments,
        totalMessages,
        avgDeliveryRate,
        avgOpenRate,
        totalRevenue: Math.round(spendStats._sum.totalSpend || 0),
        avgSpend: Math.round(spendStats._avg.totalSpend || 0),
        maxSpend: Math.round(spendStats._max.totalSpend || 0),
      },
      tagDistribution: tagCounts.filter((t: { tag: string; count: number }) => t.count > 0),
      topCities: topCities.map((c: { city: string | null; _count: { id: number } }) => ({
        city: c.city || "Unknown",
        count: c._count.id,
      })),
      recentCampaigns: recentCampaigns.map((c: { id: string; name: string; channel: string; status: string; totalMessages: number; sentCount: number; deliveredCount: number; failedCount: number; openedCount: number; clickedCount: number; createdAt: Date; segment: { name: string } }) => ({
        id: c.id,
        name: c.name,
        channel: c.channel,
        status: c.status,
        totalMessages: c.totalMessages,
        delivered: c.deliveredCount,
        opened: c.openedCount,
        failed: c.failedCount,
        segmentName: c.segment.name,
        createdAt: c.createdAt,
      })),
      channelBreakdown: channelBreakdown.map((c: { channel: string; _count: { id: number }; _sum: { totalMessages: number | null; deliveredCount: number | null } }) => ({
        channel: c.channel,
        campaigns: c._count.id,
        messages: c._sum.totalMessages || 0,
        delivered: c._sum.deliveredCount || 0,
      })),
      deliveryFunnel: {
        sent: deliveryStats._sum.sentCount || 0,
        delivered: deliveryStats._sum.deliveredCount || 0,
        opened: deliveryStats._sum.openedCount || 0,
        clicked: deliveryStats._sum.clickedCount || 0,
        failed: deliveryStats._sum.failedCount || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return Response.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
