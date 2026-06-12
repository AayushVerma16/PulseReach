import { prisma } from "@/lib/prisma";
import type { SegmentCondition } from "./types";
import type { Prisma } from "@prisma/client";

/**
 * Translates an array of SegmentConditions into a Prisma `where` clause
 * and returns matching customers.
 */

function resolveDateValue(value: string | number): Date {
  if (typeof value === "string" && value.endsWith("_days_ago")) {
    const days = parseInt(value.replace("_days_ago", ""), 10);
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }
  return new Date(value);
}

function conditionToPrismaWhere(
  condition: SegmentCondition
): Prisma.CustomerWhereInput {
  const { field, operator, value } = condition;

  switch (operator) {
    case "eq":
      return { [field]: { equals: value } };

    case "neq":
      return { [field]: { not: value } };

    case "gt":
      return { [field]: { gt: value } };

    case "gte":
      return { [field]: { gte: value } };

    case "lt":
      return { [field]: { lt: value } };

    case "lte":
      return { [field]: { lte: value } };

    case "between": {
      const [min, max] = value as unknown as [number, number];
      return { [field]: { gte: min, lte: max } };
    }

    case "in":
      return { [field]: { in: value as string[] } };

    case "notIn":
      return { [field]: { notIn: value as string[] } };

    case "contains":
      return {
        [field]: { contains: value as string, mode: "insensitive" },
      };

    case "before":
      return { [field]: { lt: resolveDateValue(value as string) } };

    case "after":
      return { [field]: { gt: resolveDateValue(value as string) } };

    case "hasTag":
      return { tags: { has: value as string } };

    case "notHasTag":
      // Prisma doesn't have a direct "not has" for arrays,
      // so we use NOT + has
      return { NOT: { tags: { has: value as string } } };

    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}

/**
 * Build a Prisma where clause from segment conditions (AND logic).
 * Optionally scoped to a specific user's customers.
 */
export function buildWhereClause(
  conditions: SegmentCondition[],
  userId?: string
): Prisma.CustomerWhereInput {
  const userFilter: Prisma.CustomerWhereInput = userId ? { userId } : {};

  if (conditions.length === 0) return userFilter;
  if (conditions.length === 1) {
    return { ...userFilter, ...conditionToPrismaWhere(conditions[0]) };
  }

  return {
    ...userFilter,
    AND: conditions.map(conditionToPrismaWhere),
  };
}

/**
 * Preview: count how many customers match the given rules.
 */
export async function previewSegmentCount(
  conditions: SegmentCondition[],
  userId?: string
): Promise<number> {
  const where = buildWhereClause(conditions, userId);
  return prisma.customer.count({ where });
}

/**
 * Get all matching customer IDs for a segment's rules.
 */
export async function getSegmentCustomerIds(
  conditions: SegmentCondition[],
  userId?: string
): Promise<string[]> {
  const where = buildWhereClause(conditions, userId);
  const customers = await prisma.customer.findMany({
    where,
    select: { id: true },
  });
  return customers.map((c) => c.id);
}

/**
 * Get a sample of matching customers (for preview).
 */
export async function previewSegmentCustomers(
  conditions: SegmentCondition[],
  limit: number = 10,
  userId?: string
) {
  const where = buildWhereClause(conditions, userId);
  const [count, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      take: limit,
      orderBy: { totalSpend: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        totalSpend: true,
        visitCount: true,
        lastVisitAt: true,
        tags: true,
      },
    }),
  ]);

  return { count, customers };
}
