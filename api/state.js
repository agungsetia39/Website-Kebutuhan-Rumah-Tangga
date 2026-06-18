import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "./_lib/auth.js";

async function getDatabase() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const sql = neon(process.env.DATABASE_URL);
  await sql`
    CREATE TABLE IF NOT EXISTS krt_app_state (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (!isAuthenticated(request)) {
    return response.status(401).json({ message: "Sesi admin tidak valid." });
  }

  const sql = await getDatabase();
  if (!sql) {
    return response.status(503).json({
      configured: false,
      message: "Database belum terhubung."
    });
  }

  if (request.method === "GET") {
    const rows = await sql`
      SELECT payload, updated_at
      FROM krt_app_state
      WHERE id = 'admin'
      LIMIT 1
    `;
    return response.status(200).json({
      configured: true,
      state: rows[0]?.payload || null,
      updatedAt: rows[0]?.updated_at || null
    });
  }

  if (request.method === "PUT") {
    const payload = request.body?.state;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return response.status(400).json({ message: "Data aplikasi tidak valid." });
    }

    const serialized = JSON.stringify(payload);
    if (serialized.length > 1_000_000) {
      return response.status(413).json({ message: "Data aplikasi terlalu besar." });
    }

    const rows = await sql`
      INSERT INTO krt_app_state (id, payload, updated_at)
      VALUES ('admin', ${serialized}::jsonb, NOW())
      ON CONFLICT (id)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
      RETURNING updated_at
    `;
    return response.status(200).json({
      saved: true,
      updatedAt: rows[0].updated_at
    });
  }

  response.setHeader("Allow", "GET, PUT");
  return response.status(405).json({ message: "Metode tidak didukung." });
}
