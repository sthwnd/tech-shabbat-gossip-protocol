CREATE TABLE `event_cosigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_key` text NOT NULL,
	`profile_url` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_event_cosigns_event_profile` ON `event_cosigns` (`event_key`,`profile_url`);--> statement-breakpoint
CREATE INDEX `idx_event_cosigns_event_key` ON `event_cosigns` (`event_key`);--> statement-breakpoint
ALTER TABLE `shabbat_submissions` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `shabbat_submissions` ADD `reviewed_at` text;--> statement-breakpoint
ALTER TABLE `shabbat_submissions` ADD `reviewed_by` text;--> statement-breakpoint
CREATE INDEX `idx_shabbat_submissions_status_created_at` ON `shabbat_submissions` (`status`,`created_at`);