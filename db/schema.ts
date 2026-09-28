import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const shabbatSubmissions = sqliteTable(
  "shabbat_submissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventName: text("event_name"),
    eventDate: text("event_date"),
    city: text("city").notNull(),
    eventUrl: text("event_url").notNull().unique(),
    hostProfile: text("host_profile").notNull(),
    announcementPost: text("announcement_post"),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    reviewedAt: text("reviewed_at"),
    reviewedBy: text("reviewed_by"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_shabbat_submissions_created_at").on(table.createdAt),
    index("idx_shabbat_submissions_status_created_at").on(table.status, table.createdAt),
  ],
);

export const eventCosigns = sqliteTable(
  "event_cosigns",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventKey: text("event_key").notNull(),
    profileUrl: text("profile_url").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_event_cosigns_event_profile").on(table.eventKey, table.profileUrl),
    index("idx_event_cosigns_event_key").on(table.eventKey),
  ],
);

export const eventGossip = sqliteTable(
  "event_gossip",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventKey: text("event_key").notNull(),
    postUrl: text("post_url").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    reviewedAt: text("reviewed_at"),
    reviewedBy: text("reviewed_by"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_event_gossip_event_post").on(table.eventKey, table.postUrl),
    index("idx_event_gossip_status_created_at").on(table.status, table.createdAt),
  ],
);
