import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

/**
 * POST /api/customers/upload
 *
 * Accepts a CSV file upload via multipart/form-data.
 * Expected CSV columns: name, email, phone, city
 * (header row required, order doesn't matter)
 *
 * Creates Customer records in the database, skipping
 * duplicates (by email + userId).
 */

interface CsvRow {
  name: string;
  email: string;
  phone?: string;
  city?: string;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    // Handle quoted fields (basic CSV parsing)
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  });

  return { headers, rows };
}

function validateAndMapRows(
  headers: string[],
  rows: string[][]
): { valid: CsvRow[]; errors: string[] } {
  const nameIdx = headers.indexOf("name");
  const emailIdx = headers.indexOf("email");
  const phoneIdx = headers.indexOf("phone");
  const cityIdx = headers.indexOf("city");

  const errors: string[] = [];

  if (nameIdx === -1) errors.push('Missing required column: "name"');
  if (emailIdx === -1) errors.push('Missing required column: "email"');

  if (errors.length > 0) return { valid: [], errors };

  const valid: CsvRow[] = [];
  const seenEmails = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // +2 because line 1 is header, data starts at 2

    const name = row[nameIdx]?.trim();
    const email = row[emailIdx]?.trim().toLowerCase();
    const phone = phoneIdx >= 0 ? row[phoneIdx]?.trim() : undefined;
    const city = cityIdx >= 0 ? row[cityIdx]?.trim() : undefined;

    if (!name) {
      errors.push(`Row ${lineNum}: Missing name`);
      continue;
    }
    if (!email) {
      errors.push(`Row ${lineNum}: Missing email`);
      continue;
    }
    // Basic email validation
    if (!email.includes("@")) {
      errors.push(`Row ${lineNum}: Invalid email "${email}"`);
      continue;
    }
    // Deduplicate within file
    if (seenEmails.has(email)) {
      errors.push(`Row ${lineNum}: Duplicate email "${email}" in CSV`);
      continue;
    }
    seenEmails.add(email);

    valid.push({
      name,
      email,
      phone: phone || undefined,
      city: city || undefined,
    });
  }

  return { valid, errors };
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { userId } = authResult;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { error: "No file uploaded. Please attach a CSV file." },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv")) {
      return Response.json(
        { error: "Invalid file type. Please upload a .csv file." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const text = await file.text();
    const { headers, rows } = parseCsv(text);

    if (rows.length === 0) {
      return Response.json(
        { error: "CSV file is empty or has no data rows." },
        { status: 400 }
      );
    }

    const { valid, errors } = validateAndMapRows(headers, rows);

    if (valid.length === 0) {
      return Response.json(
        {
          error: "No valid rows found in CSV.",
          validationErrors: errors,
          totalRows: rows.length,
        },
        { status: 400 }
      );
    }

    // Check for existing customers (by email + userId) to avoid duplicates
    const existingEmails = new Set(
      (
        await prisma.customer.findMany({
          where: {
            userId,
            email: { in: valid.map((r) => r.email) },
          },
          select: { email: true },
        })
      ).map((c: { email: string }) => c.email)
    );

    const newCustomers = valid.filter((r) => !existingEmails.has(r.email));
    const skippedCount = valid.length - newCustomers.length;

    // Batch insert new customers
    if (newCustomers.length > 0) {
      await prisma.customer.createMany({
        data: newCustomers.map((c) => ({
          userId,
          name: c.name,
          email: c.email,
          phone: c.phone || null,
          city: c.city || null,
          tags: ["new"],
        })),
      });
    }

    return Response.json({
      success: true,
      summary: {
        totalRows: rows.length,
        imported: newCustomers.length,
        skipped: skippedCount,
        errors: errors.length,
      },
      validationErrors: errors.length > 0 ? errors.slice(0, 20) : undefined,
      message: `Successfully imported ${newCustomers.length} customer${
        newCustomers.length !== 1 ? "s" : ""
      }${skippedCount > 0 ? ` (${skippedCount} duplicates skipped)` : ""}.`,
    });
  } catch (error) {
    console.error("CSV upload failed:", error);
    return Response.json(
      { error: "Failed to process CSV upload." },
      { status: 500 }
    );
  }
}
