import "dotenv/config";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Removing all application data...");

  // Delete in order to respect foreign keys
  await pool.query('DELETE FROM "Campaign"');
  console.log("Deleted campaigns");
  await pool.query('DELETE FROM "Segment"');
  console.log("Deleted segments");
  await pool.query('DELETE FROM "Customer"');
  console.log("Deleted customers");

  console.log("✅ All demo data removed.");
  await pool.end();
}

main().then(() => process.exit(0));
