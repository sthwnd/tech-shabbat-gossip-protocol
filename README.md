# Tech Shabbat Gossip Protocol

Not everyone gets a seat at the Shabbat table. But everyone gets the Twitter gossip.

[Live site](https://shabbatgossip.com) · [Agent transcript](https://chatgpt.com/s/cx_6ab985540da88191823c29beeab88c03)

A social layer for tech Shabbats around the world. Hosts can submit their existing Luma, Partiful, or other event page; guests can cosign a table with a public X or LinkedIn profile and attach public gossip from X.

## What it does

- Maps past and upcoming tech Shabbats by city.
- Embeds the public posts around each table.
- Accepts new Shabbat submissions without becoming an event-management platform.
- Keeps submitted events and gossip in a private moderation queue until approved.
- Lets visitors cosign tables without creating an account.
- Displays the public profiles that cosigned each table.
- Supports transactional email notifications for new pending events once Resend is configured.

## Stack

- Next.js-compatible Vinext app on Cloudflare Workers
- React and TypeScript
- Cloudflare D1 with Drizzle ORM
- Sites hosting and custom-domain routing

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Build the production Worker with:

```bash
npm run build
```

## Email notifications

The new-event notification hook uses these production environment variables:

- `RESEND_API_KEY`
- `NOTIFICATION_FROM`
- `NOTIFICATION_EMAIL`

Submissions continue to enter moderation if email delivery is unavailable.

## Moderation

The public site is anonymous. The `/moderate` route uses Sign in with ChatGPT and a server-side moderator allowlist; visitor actions never require ChatGPT authentication.

Built by [Lisa Akselrod](https://x.com/cryptobuilder_).
