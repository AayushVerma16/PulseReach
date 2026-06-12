import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const { id } = await params;

    // Check if the segment exists and belongs to the user
    const segment = await prisma.segment.findUnique({
      where: { id },
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    if (segment.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the segment
    // Note: This will fail if there are campaigns tied to this segment
    // due to foreign key constraints in Prisma (no cascade on campaign -> segment).
    await prisma.segment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting segment:", error);
    // Prisma specific error code for foreign key constraint failure
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete segment because it is used by one or more campaigns." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 }
    );
  }
}
