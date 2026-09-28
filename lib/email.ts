import { env } from "cloudflare:workers";

type PendingShabbat = {
  id: number;
  eventName: string | null;
  eventDate: string | null;
  city: string;
  eventUrl: string;
  hostProfile: string;
  announcementPost: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function notifyNewShabbat(submission: PendingShabbat) {
  const runtime = env as unknown as Record<string, string | undefined>;
  const apiKey = runtime.RESEND_API_KEY;
  const from = runtime.NOTIFICATION_FROM;
  const to = runtime.NOTIFICATION_EMAIL;

  if (!apiKey || !from || !to) return { sent: false, reason: "not_configured" as const };

  const city = escapeHtml(submission.city);
  const eventName = escapeHtml(submission.eventName || `Shabbat #${submission.id}`);
  const eventDate = submission.eventDate ? escapeHtml(submission.eventDate) : "";
  const eventUrl = escapeHtml(submission.eventUrl);
  const hostProfile = escapeHtml(submission.hostProfile);
  const announcement = submission.announcementPost
    ? `<p><strong>Announcement:</strong> <a href="${escapeHtml(submission.announcementPost)}">${escapeHtml(submission.announcementPost)}</a></p>`
    : "";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": `shabbat-submission-${submission.id}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New Shabbat waiting: ${submission.eventName || submission.city}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#080707;line-height:1.5">
          <h1 style="font-family:Georgia,serif;font-weight:400">A new table is waiting.</h1>
          <p><strong>Name:</strong> ${eventName}</p>
          ${eventDate ? `<p><strong>Date:</strong> ${eventDate}</p>` : ""}
          <p><strong>City:</strong> ${city}</p>
          <p><strong>Event:</strong> <a href="${eventUrl}">${eventUrl}</a></p>
          <p><strong>Host:</strong> <a href="${hostProfile}">${hostProfile}</a></p>
          ${announcement}
          <p style="margin-top:28px"><a href="https://shabbatgossip.com/moderate">Review the guest list</a></p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}`);
  }

  return { sent: true as const };
}
