import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const tag = searchParams.get("tag");

    const where = {
      userId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { city: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { orders: true } },
          orders: {
            take: 3,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              amount: true,
              items: true,
              channel: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return Response.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return Response.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
