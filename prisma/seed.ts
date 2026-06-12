import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  firstNames,
  lastNames,
  cities,
  productCategories,
  channels,
} from "../lib/data/customer-names";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const now = Date.now();
  const ms = now - Math.random() * daysAgo * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

function generatePhone(): string {
  return `+91${randBetween(7000000000, 9999999999)}`;
}

function generateEmail(first: string, last: string, idx: number): string {
  const domains = ["gmail.com", "yahoo.co.in", "outlook.com", "hotmail.com"];
  return `${first.toLowerCase()}.${last.toLowerCase()}${idx}@${pick(domains)}`;
}

// ------------------------------------------------------------------
// Main Seed
// ------------------------------------------------------------------

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding database...");

  // Clear existing data (order matters due to foreign keys)
  await prisma.message.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("  ✓ Cleared existing data");

  // ------------------------------------------------------------------
  // 0. Create a demo user (seed data will belong to this user)
  // ------------------------------------------------------------------
  const demoUser = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@xenocrm.dev",
    },
  });

  const userId = demoUser.id;
  console.log(`  ✓ Created demo user (${demoUser.email})`);

  // ------------------------------------------------------------------
  // 1. Create Customers
  // ------------------------------------------------------------------
  const NUM_CUSTOMERS = 1000;
  const customerData: Array<{
    userId: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    createdAt: Date;
    tags: string[];
  }> = [];

  const usedEmails = new Set<string>();

  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    let email = generateEmail(first, last, i);
    while (usedEmails.has(email)) {
      email = generateEmail(first, last, i + randBetween(1000, 9999));
    }
    usedEmails.add(email);

    customerData.push({
      userId,
      name: `${first} ${last}`,
      email,
      phone: generatePhone(),
      city: pick(cities),
      createdAt: randomDate(365), // joined in last year
      tags: [],
    });
  }

  await prisma.customer.createMany({ data: customerData });
  const customers = await prisma.customer.findMany({
    where: { userId },
    select: { id: true },
  });
  console.log(`  ✓ Created ${customers.length} customers`);

  // ------------------------------------------------------------------
  // 2. Create Orders
  // ------------------------------------------------------------------
  const orderBatch: Array<{
    customerId: string;
    amount: number;
    items: string;
    channel: string;
    createdAt: Date;
  }> = [];

  // Each customer gets 0-15 orders (weighted toward fewer orders)
  for (const customer of customers) {
    const orderCount = Math.floor(Math.random() ** 0.7 * 16); // power law distribution
    for (let j = 0; j < orderCount; j++) {
      const cat = pick(productCategories);
      const numItems = randBetween(1, 4);
      const items = [];
      let total = 0;

      for (let k = 0; k < numItems; k++) {
        const price = randBetween(199, 4999);
        const qty = randBetween(1, 3);
        items.push({
          name: pick(cat.items),
          category: cat.category,
          qty,
          price,
        });
        total += price * qty;
      }

      orderBatch.push({
        customerId: customer.id,
        amount: total,
        items: JSON.stringify(items),
        channel: pick(channels),
        createdAt: randomDate(365),
      });
    }
  }

  // Insert in batches of 500
  for (let i = 0; i < orderBatch.length; i += 500) {
    await prisma.order.createMany({ data: orderBatch.slice(i, i + 500) });
  }
  console.log(`  ✓ Created ${orderBatch.length} orders`);

  // ------------------------------------------------------------------
  // 3. Compute derived fields & tags
  // ------------------------------------------------------------------
  const customerStats = await prisma.order.groupBy({
    by: ["customerId"],
    _sum: { amount: true },
    _count: { id: true },
    _max: { createdAt: true },
  });

  let updated = 0;
  for (const stat of customerStats) {
    const totalSpend = stat._sum.amount ?? 0;
    const visitCount = stat._count.id;
    const lastVisitAt = stat._max.createdAt;

    // Compute tags
    const tags: string[] = [];
    const daysSinceLastVisit = lastVisitAt
      ? (Date.now() - new Date(lastVisitAt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (totalSpend > 15000) tags.push("high-value");
    else if (totalSpend > 5000) tags.push("mid-value");
    else tags.push("low-value");

    if (daysSinceLastVisit > 90) tags.push("churned");
    else if (daysSinceLastVisit > 30) tags.push("at-risk");
    else tags.push("active");

    if (visitCount >= 10) tags.push("loyal");
    if (visitCount === 1) tags.push("one-time");

    // Check if they joined in last 30 days
    const customer = await prisma.customer.findUnique({
      where: { id: stat.customerId },
      select: { createdAt: true },
    });
    if (customer) {
      const daysSinceJoin =
        (Date.now() - new Date(customer.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceJoin < 30) tags.push("new");
    }

    await prisma.customer.update({
      where: { id: stat.customerId },
      data: { totalSpend, visitCount, lastVisitAt, tags },
    });
    updated++;
  }

  // Tag customers with no orders
  await prisma.customer.updateMany({
    where: { userId, visitCount: 0 },
    data: { tags: ["no-purchase", "new"] },
  });

  console.log(`  ✓ Updated ${updated} customers with stats & tags`);

  // ------------------------------------------------------------------
  // 4. Create a few pre-built segments
  // ------------------------------------------------------------------
  const highValueCount = await prisma.customer.count({
    where: { userId, tags: { has: "high-value" } },
  });

  const churnedCount = await prisma.customer.count({
    where: { userId, tags: { has: "churned" } },
  });

  const activeCount = await prisma.customer.count({
    where: { userId, tags: { has: "active" } },
  });

  await prisma.segment.createMany({
    data: [
      {
        userId,
        name: "High-Value Customers",
        description: "Customers who have spent more than ₹15,000",
        rules: JSON.stringify([
          { field: "totalSpend", operator: "gt", value: 15000 },
        ]),
        naturalQuery: "customers who spent more than 15000 rupees",
        customerCount: highValueCount,
      },
      {
        userId,
        name: "Churned Customers",
        description:
          "Customers who haven't purchased in the last 90 days",
        rules: JSON.stringify([
          { field: "lastVisitAt", operator: "before", value: "90_days_ago" },
        ]),
        naturalQuery:
          "customers who haven't bought anything in 3 months",
        customerCount: churnedCount,
      },
      {
        userId,
        name: "Active Shoppers",
        description: "Customers who purchased in the last 30 days",
        rules: JSON.stringify([
          { field: "lastVisitAt", operator: "after", value: "30_days_ago" },
        ]),
        naturalQuery: "customers who bought something in the last month",
        customerCount: activeCount,
      },
    ],
  });

  console.log("  ✓ Created 3 starter segments");

  console.log("\n✅ Seed complete!");
  console.log(`   Demo user: ${demoUser.email}`);
  console.log("   Login with Google to create your own account,");
  console.log("   or the demo data will be visible to the demo user.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
