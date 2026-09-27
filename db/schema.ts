import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const shabbatSubmissions = sqliteTable(
  "shabbat_submissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    city: text("city").notNull(),
    eventUrl: text("event_url").notNull().unique(),
    hostProfile: text("host_profile").notNull(),
    announcementPost: text("announcement_post"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_shabbat_submissions_created_at").on(table.createdAt),
  ],
);
