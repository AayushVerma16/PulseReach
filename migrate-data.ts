import "dotenv/config";
import pg from "pg";

/**
 * Migrates all seed data (customers, orders, segments, campaigns)
 * from the demo user to the currently active session user.
 */
async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  // Find the active session user
  const sessionResult = await pool.query(
    'SELECT "userId" FROM "Session" WHERE expires > NOW() ORDER BY expires DESC LIMIT 1'
  );

  if (sessionResult.rows.length === 0) {
    console.log("No active session found. Please log in first.");
    await pool.end();
    return;
  }

  const activeUserId = sessionResult.rows[0].userId;
  console.log("Active user ID:", activeUserId);

  // Find the demo user
  const demoResult = await pool.query(
    "SELECT id FROM \"User\" WHERE email = 'demo@xenocrm.dev'"
  );

  if (demoResult.rows.length === 0) {
    console.log("Demo user not found.");
    await pool.end();
    return;
  }

  const demoUserId = demoResult.rows[0].id;
  console.log("Demo user ID:", demoUserId);

  if (activeUserId === demoUserId) {
    console.log("Active user IS the demo user. Nothing to migrate.");
    await pool.end();
    return;
  }

  // Migrate all data from demo user to active user
  const tables = ["Customer", "Segment", "Campaign", "ChatMessage"];

  for (const table of tables) {
    const result = await pool.query(
      `UPDATE "${table}" SET "userId" = $1 WHERE "userId" = $2`,
      [activeUserId, demoUserId]
    );
    console.log(`${table}: migrated ${result.rowCount} rows`);
  }

  console.log("\n✅ All seed data migrated to your account!");
  await pool.end();
}

main().then(() => process.exit(0));
