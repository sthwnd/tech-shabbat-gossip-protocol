CREATE TABLE `event_gossip` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_key` text NOT NULL,
	`post_url` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_at` text,
	`reviewed_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_event_gossip_event_post` ON `event_gossip` (`event_key`,`post_url`);--> statement-breakpoint
CREATE INDEX `idx_event_gossip_status_created_at` ON `event_gossip` (`status`,`created_at`);