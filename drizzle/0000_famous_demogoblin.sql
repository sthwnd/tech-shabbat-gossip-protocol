CREATE TABLE `shabbat_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`city` text NOT NULL,
	`event_url` text NOT NULL,
	`host_profile` text NOT NULL,
	`announcement_post` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shabbat_submissions_event_url_unique` ON `shabbat_submissions` (`event_url`);--> statement-breakpoint
CREATE INDEX `idx_shabbat_submissions_created_at` ON `shabbat_submissions` (`created_at`);--> statement-breakpoint
PRAGMA optimize;
