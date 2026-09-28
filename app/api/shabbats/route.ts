import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { shabbatSubmissions } from "../../../db/schema";
import { notifyNewShabbat } from "../../../lib/email";

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

function cleanEventName(value: unknown) {
  const eventName = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!eventName || eventName.length > 120) throw new Error("invalid_event_name");
  return eventName;
}

function cleanEventDate(value: unknown) {
  const eventDate = typeof value === "string" ? value.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) throw new Error("invalid_event_date");

  const parsed = new Date(`${eventDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== eventDate) {
    throw new Error("invalid_event_date");
  }

  return eventDate;
}

export async function GET() {
  try {
    const db = getDb();
    const submissions = await db
      .select()
      .from(shabbatSubmissions)
      .where(eq(shabbatSubmissions.status, "approved"))
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
    const eventName = cleanEventName(payload.eventName);
    const eventDate = cleanEventDate(payload.eventDate);
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
      .values({ eventName, eventDate, city, eventUrl, hostProfile, announcementPost })
      .onConflictDoNothing({ target: shabbatSubmissions.eventUrl })
      .returning();

    if (created) {
      try {
        await notifyNewShabbat(created);
      } catch (error) {
        console.error("Unable to send pending Shabbat notification", error);
      }
      return Response.json({ submission: created, moderation: "pending" }, { status: 201 });
    }

    const [existing] = await db
      .select()
      .from(shabbatSubmissions)
      .where(eq(shabbatSubmissions.eventUrl, eventUrl))
      .limit(1);

    if (existing && existing.status !== "approved") {
      const wasRejected = existing.status === "rejected";
      const [resubmitted] = await db
        .update(shabbatSubmissions)
        .set({
          eventName,
          eventDate,
          city,
          hostProfile,
          announcementPost,
          status: "pending",
          reviewedAt: null,
          reviewedBy: null,
          ...(wasRejected ? { createdAt: new Date().toISOString() } : {}),
        })
        .where(eq(shabbatSubmissions.id, existing.id))
        .returning();

      if (wasRejected && resubmitted) {
        try {
          await notifyNewShabbat(resubmitted);
        } catch (error) {
          console.error("Unable to send resubmitted Shabbat notification", error);
        }
      }

      return Response.json(
        { submission: resubmitted, moderation: "pending" },
        { status: wasRejected ? 201 : 200 },
      );
    }

    return Response.json({ submission: existing, moderation: existing?.status ?? "pending" }, { status: 200 });
  } catch (error) {
    console.error("Unable to save Shabbat submission", error);
    return Response.json({ error: "invalid_submission" }, { status: 400 });
  }
}
