import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateSegmentInput } from "@/lib/segmentation/types";
import { previewSegmentCount } from "@/lib/segmentation/engine";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    const segments = await prisma.segment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { campaigns: true } },
      },
    });

    return Response.json({ segments });
  } catch (error) {
    console.error("Failed to fetch segments:", error);
    return Response.json(
      { error: "Failed to fetch segments" },
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
    const parsed = CreateSegmentInput.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, rules, naturalQuery } = parsed.data;

    // Preview count (scoped to user's customers)
    const customerCount = await previewSegmentCount(rules, userId);

    const segment = await prisma.segment.create({
      data: {
        userId,
        name,
        description,
        rules: JSON.stringify(rules),
        naturalQuery,
        customerCount,
      },
    });

    return Response.json({ segment, customerCount }, { status: 201 });
  } catch (error) {
    console.error("Failed to create segment:", error);
    return Response.json(
      { error: "Failed to create segment" },
      { status: 500 }
    );
  }
}
