import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { eventGossip } from "../../../db/schema";

function cleanEventKey(value: unknown) {
  const key = typeof value === "string" ? value.trim() : "";
  if (!/^[a-z0-9-]{1,100}$/.test(key)) throw new Error("invalid_event");
  return key;
}

function cleanPostUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.length > 500) throw new Error("invalid_post");

  const url = new URL(raw);
  const host = url.hostname.replace(/^www\./, "");
  if (url.protocol !== "https:" || !["x.com", "twitter.com"].includes(host) || !url.pathname.includes("/status/")) {
    throw new Error("invalid_post");
  }

  url.hash = "";
  return url.toString();
}

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select({ eventKey: eventGossip.eventKey, postUrl: eventGossip.postUrl })
      .from(eventGossip)
      .where(eq(eventGossip.status, "approved"))
      .orderBy(asc(eventGossip.createdAt));

    const gossip: Record<string, string[]> = {};
    for (const row of rows) {
      gossip[row.eventKey] = [...(gossip[row.eventKey] ?? []), row.postUrl];
    }
    return Response.json({ gossip });
  } catch (error) {
    console.error("Unable to load gossip", error);
    return Response.json({ error: "unavailable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const eventKey = cleanEventKey(payload.eventKey);
    const postUrl = cleanPostUrl(payload.postUrl);
    const db = getDb();

    const [created] = await db
      .insert(eventGossip)
      .values({ eventKey, postUrl })
      .onConflictDoNothing({ target: [eventGossip.eventKey, eventGossip.postUrl] })
      .returning();

    if (created) return Response.json({ gossip: created, moderation: "pending" }, { status: 201 });

    const [existing] = await db
      .select()
      .from(eventGossip)
      .where(and(eq(eventGossip.eventKey, eventKey), eq(eventGossip.postUrl, postUrl)))
      .limit(1);
    return Response.json({ gossip: existing, moderation: existing?.status ?? "pending" });
  } catch (error) {
    console.error("Unable to save gossip", error);
    return Response.json({ error: "invalid_gossip" }, { status: 400 });
  }
}
