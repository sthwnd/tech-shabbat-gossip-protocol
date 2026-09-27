import { count, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { eventCosigns } from "../../../db/schema";

function cleanProfileUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.length > 500) throw new Error("invalid_profile");

  const url = new URL(raw);
  const host = url.hostname.replace(/^www\./, "");
  if (url.protocol !== "https:" || !["x.com", "twitter.com", "linkedin.com"].includes(host)) {
    throw new Error("invalid_profile");
  }

  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

function cleanEventKey(value: unknown) {
  const key = typeof value === "string" ? value.trim() : "";
  if (!/^[a-z0-9-]{1,100}$/.test(key)) throw new Error("invalid_event");
  return key;
}

async function countForEvent(eventKey: string) {
  const db = getDb();
  const [result] = await db
    .select({ value: count() })
    .from(eventCosigns)
    .where(eq(eventCosigns.eventKey, eventKey));
  return Number(result?.value ?? 0);
}

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select({ eventKey: eventCosigns.eventKey, value: count() })
      .from(eventCosigns)
      .groupBy(eventCosigns.eventKey);

    return Response.json({
      counts: Object.fromEntries(rows.map((row) => [row.eventKey, Number(row.value)])),
    });
  } catch (error) {
    console.error("Unable to load cosigns", error);
    return Response.json({ error: "unavailable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const eventKey = cleanEventKey(payload.eventKey);
    const profileUrl = cleanProfileUrl(payload.profileUrl);
    const db = getDb();

    const [created] = await db
      .insert(eventCosigns)
      .values({ eventKey, profileUrl })
      .onConflictDoNothing({ target: [eventCosigns.eventKey, eventCosigns.profileUrl] })
      .returning({ id: eventCosigns.id });

    return Response.json({
      count: await countForEvent(eventKey),
      created: Boolean(created),
    }, { status: created ? 201 : 200 });
  } catch (error) {
    console.error("Unable to save cosign", error);
    return Response.json({ error: "invalid_cosign" }, { status: 400 });
  }
}
