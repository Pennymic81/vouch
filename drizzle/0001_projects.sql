CREATE TABLE `milestone` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`position` integer NOT NULL,
	`title` text NOT NULL,
	`criteria` text NOT NULL,
	`amount` integer NOT NULL,
	`duration_days` integer NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "milestone_amount_check" CHECK("milestone"."amount" > 0),
	CONSTRAINT "milestone_duration_check" CHECK("milestone"."duration_days" > 0)
);
--> statement-breakpoint
CREATE INDEX `milestone_project_id_idx` ON `milestone` (`project_id`);--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`title` text NOT NULL,
	`idea` text NOT NULL,
	`summary` text,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "project_status_check" CHECK("project"."status" in ('draft', 'open', 'in_progress', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE INDEX `project_client_id_idx` ON `project` (`client_id`);