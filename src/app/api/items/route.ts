import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, items, type NewItem } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getDb()
    .select()
    .from(items)
    .orderBy(desc(items.createdAt))
    .limit(50);
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<NewItem>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const [row] = await getDb().insert(items).values({ name }).returning();
  return NextResponse.json({ item: row }, { status: 201 });
}
