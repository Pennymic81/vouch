CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activity_project_idx` ON `activity` (`project_id`);--> statement-breakpoint
CREATE TABLE `qa_review` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`checks` text NOT NULL,
	`passed` integer NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `qa_review_submission_idx` ON `qa_review` (`submission_id`);--> statement-breakpoint
CREATE TABLE `submission` (
	`id` text PRIMARY KEY NOT NULL,
	`milestone_id` text NOT NULL,
	`developer_id` text NOT NULL,
	`round` integer NOT NULL,
	`note` text NOT NULL,
	`demo_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`milestone_id`) REFERENCES `milestone`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`developer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `submission_milestone_idx` ON `submission` (`milestone_id`);--> statement-breakpoint
ALTER TABLE `milestone` ADD `funded_at` integer;--> statement-breakpoint
ALTER TABLE `milestone` ADD `submitted_at` integer;--> statement-breakpoint
ALTER TABLE `milestone` ADD `qa_passed_at` integer;--> statement-breakpoint
ALTER TABLE `milestone` ADD `paid_at` integer;--> statement-breakpoint
ALTER TABLE `milestone` ADD `auto_approved` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `milestone` ADD `owner_feedback` text;