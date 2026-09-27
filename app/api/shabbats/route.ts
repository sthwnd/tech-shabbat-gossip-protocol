import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { shabbatSubmissions } from "../../../db/schema";

const cityAliases: Record<string, string> = {
  "sf": "San Francisco",
  "san fran": "San Francisco",
  "san francisco": "San Francisco",
  "bay area": "San Francisco",
  "tlv": "Tel Aviv",
  "tel-aviv": "Tel Aviv",
  "tel aviv": "Tel Aviv",
  "nyc": "New York",
  "new york city": "New York",
  "new york": "New York",
  "la": "Los Angeles",
  "los angeles": "Los Angeles",
  "cdmx": "Mexico City",
  "mexico city": "Mexico City",
  "dc": "Washington, DC",
  "washington dc": "Washington, DC",
  "washington, dc": "Washington, DC",
};

function normalizeCity(value: unknown) {
  const city = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!city) return "";

  const key = city.toLocaleLowerCase("en-US");
  if (cityAliases[key]) return cityAliases[key];

  return key.replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toLocaleUpperCase("en-US"));
}

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
    const city = normalizeCity(payload.city);

    if (!city || city.length > 80) {
      return Response.json({ error: "invalid_city" }, { status: 400 });
    }

    const eventUrl = cleanUrl(payload.eventUrl, true)!;
    const hostProfile = cleanUrl(payload.hostProfile, true)!;
    const announcementPost = cleanUrl(payload.announcementPost, false);
    const hostDomain = new URL(hostProfile).hostname.replace(/^www\./, "");

    if (!["x.com", "twitter.com", "linkedin.com"].includes(hostDomain)) {
      return Response.json({ error: "invalid_host_profile" }, { status: 400 });
    }

    if (announcementPost) {
      const announcementDomain = new URL(announcementPost).hostname.replace(/^www\./, "");
      if (!["x.com", "twitter.com", "linkedin.com"].includes(announcementDomain)) {
        return Response.json({ error: "invalid_announcement" }, { status: 400 });
      }
    }

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
