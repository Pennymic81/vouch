CREATE TABLE `developer_profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`headline` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`hourly_rate` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`skills` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "developer_rate_check" CHECK("developer_profile"."hourly_rate" > 0)
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`developer_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`score` integer NOT NULL,
	`responded_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`developer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "invitation_status_check" CHECK("invitation"."status" in ('pending', 'accepted', 'declined', 'withdrawn'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_project_developer_idx` ON `invitation` (`project_id`,`developer_id`);--> statement-breakpoint
CREATE INDEX `invitation_developer_idx` ON `invitation` (`developer_id`);--> statement-breakpoint
CREATE TABLE `proof` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`skills` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `proof_user_id_idx` ON `proof` (`user_id`);--> statement-breakpoint
ALTER TABLE `project` ADD `skills` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `project` ADD `developer_id` text REFERENCES user(id);