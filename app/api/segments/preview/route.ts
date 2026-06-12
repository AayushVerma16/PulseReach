import { NextRequest } from "next/server";
import { previewSegmentCustomers } from "@/lib/segmentation/engine";
import { SegmentCondition } from "@/lib/segmentation/types";
import { requireAuth } from "@/lib/auth-guard";
import { z } from "zod";

/**
 * POST /api/segments/preview
 *
 * Preview how many customers match a set of rules,
 * without saving the segment. Used by the visual rule builder.
 */

const PreviewInput = z.object({
  rules: z.array(SegmentCondition),
  limit: z.number().optional().default(5),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    const body = await request.json();
    const parsed = PreviewInput.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid rules", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { rules, limit } = parsed.data;
    const preview = await previewSegmentCustomers(rules, limit, userId);

    return Response.json({
      count: preview.count,
      customers: preview.customers,
    });
  } catch (error) {
    console.error("Failed to preview segment:", error);
    return Response.json(
      { error: "Failed to preview segment" },
      { status: 500 }
    );
  }
}
