import "dotenv/config";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  const users = await pool.query('SELECT id, email FROM "User" LIMIT 5');
  console.log("Users:", JSON.stringify(users.rows));

  const segments = await pool.query('SELECT id, name, "userId" FROM "Segment" LIMIT 5');
  console.log("Segments:", JSON.stringify(segments.rows));

  const sessions = await pool.query('SELECT "userId", expires FROM "Session" LIMIT 5');
  console.log("Sessions:", JSON.stringify(sessions.rows));

  await pool.end();
}

main().then(() => process.exit(0));
