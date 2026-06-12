import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { previewSegmentCustomers } from "@/lib/segmentation/engine";
import type { SegmentCondition } from "@/lib/segmentation/types";
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

    const segment = await prisma.segment.findUnique({
      where: { id },
    });

    if (!segment || segment.userId !== userId) {
      return Response.json({ error: "Segment not found" }, { status: 404 });
    }

    const rules = (
      typeof segment.rules === "string"
        ? JSON.parse(segment.rules)
        : segment.rules
    ) as SegmentCondition[];

    const limit = parseInt(
      request.nextUrl.searchParams.get("limit") || "20",
      10
    );

    const preview = await previewSegmentCustomers(rules, limit, userId);

    return Response.json({
      segment,
      ...preview,
    });
  } catch (error) {
    console.error("Failed to preview segment:", error);
    return Response.json(
      { error: "Failed to preview segment" },
      { status: 500 }
    );
  }
}
