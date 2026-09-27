import { desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { eventGossip, shabbatSubmissions } from "../../../db/schema";

const MODERATOR_EMAIL = "lisaakselrod@gmail.com";

async function requireModerator() {
  const user = await getChatGPTUser();
  if (!user || user.email.toLocaleLowerCase("en-US") !== MODERATOR_EMAIL) return null;
  return user;
}

export async function GET() {
  const user = await requireModerator();
  if (!user) return Response.json({ error: "forbidden" }, { status: 403 });

  try {
    const db = getDb();
    const [submissions, gossip] = await Promise.all([
      db
        .select()
        .from(shabbatSubmissions)
        .where(eq(shabbatSubmissions.status, "pending"))
        .orderBy(desc(shabbatSubmissions.createdAt), desc(shabbatSubmissions.id)),
      db
        .select()
        .from(eventGossip)
        .where(eq(eventGossip.status, "pending"))
        .orderBy(desc(eventGossip.createdAt), desc(eventGossip.id)),
    ]);
    return Response.json({ submissions, gossip });
  } catch (error) {
    console.error("Unable to load moderation queue", error);
    return Response.json({ error: "unavailable" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await requireModerator();
  if (!user) return Response.json({ error: "forbidden" }, { status: 403 });

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const id = Number(payload.id);
    const action = payload.action;
    const kind = payload.kind;
    if (
      !Number.isInteger(id) ||
      id < 1 ||
      !["approve", "reject"].includes(String(action)) ||
      !["shabbat", "gossip"].includes(String(kind))
    ) {
      return Response.json({ error: "invalid_action" }, { status: 400 });
    }

    const status = action === "approve" ? "approved" : "rejected";
    const db = getDb();
    const reviewed = { status, reviewedAt: new Date().toISOString(), reviewedBy: user.email };
    const [updated] = kind === "gossip"
      ? await db.update(eventGossip).set(reviewed).where(eq(eventGossip.id, id)).returning()
      : await db.update(shabbatSubmissions).set(reviewed).where(eq(shabbatSubmissions.id, id)).returning();

    if (!updated) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({ submission: updated });
  } catch (error) {
    console.error("Unable to moderate submission", error);
    return Response.json({ error: "unavailable" }, { status: 500 });
  }
}
