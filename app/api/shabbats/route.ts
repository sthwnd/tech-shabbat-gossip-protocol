import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { shabbatSubmissions } from "../../../db/schema";

function cleanUrl(value: unknown, required: boolean) {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw && !required) return null;
  if (!raw) throw new Error("required");

  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("invalid");
  }

  return url.toString();
}

export async function GET() {
  try {
    const db = getDb();
    const submissions = await db
      .select()
      .from(shabbatSubmissions)
      .orderBy(desc(shabbatSubmissions.createdAt), desc(shabbatSubmissions.id))
      .limit(50);

    return Response.json({ submissions });
  } catch (error) {
    console.error("Unable to load Shabbat submissions", error);
    return Response.json({ error: "unavailable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const city = typeof payload.city === "string" ? payload.city.trim() : "";

    if (!city || city.length > 80) {
      return Response.json({ error: "invalid_city" }, { status: 400 });
    }

    const eventUrl = cleanUrl(payload.eventUrl, true)!;
    const hostProfile = cleanUrl(payload.hostProfile, true)!;
    const announcementPost = cleanUrl(payload.announcementPost, false);
    const db = getDb();

    const [created] = await db
      .insert(shabbatSubmissions)
      .values({ city, eventUrl, hostProfile, announcementPost })
      .onConflictDoNothing({ target: shabbatSubmissions.eventUrl })
      .returning();

    if (created) {
      return Response.json({ submission: created }, { status: 201 });
    }

    const [existing] = await db
      .select()
      .from(shabbatSubmissions)
      .where(eq(shabbatSubmissions.eventUrl, eventUrl))
      .limit(1);

    return Response.json({ submission: existing }, { status: 200 });
  } catch (error) {
    console.error("Unable to save Shabbat submission", error);
    return Response.json({ error: "invalid_submission" }, { status: 400 });
  }
}
