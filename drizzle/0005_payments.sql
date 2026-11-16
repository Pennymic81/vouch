CREATE TABLE `payment` (
	`id` text PRIMARY KEY NOT NULL,
	`milestone_id` text NOT NULL,
	`client_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`channel` text,
	`paid_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`milestone_id`) REFERENCES `milestone`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payment_milestone_idx` ON `payment` (`milestone_id`);--> statement-breakpoint
CREATE TABLE `payout` (
	`id` text PRIMARY KEY NOT NULL,
	`milestone_id` text NOT NULL,
	`developer_id` text NOT NULL,
	`gross` integer NOT NULL,
	`fee` integer NOT NULL,
	`net` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`transfer_code` text,
	`failure_reason` text,
	`sent_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`milestone_id`) REFERENCES `milestone`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`developer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payout_milestone_id_unique` ON `payout` (`milestone_id`);--> statement-breakpoint
CREATE INDEX `payout_developer_idx` ON `payout` (`developer_id`);--> statement-breakpoint
CREATE TABLE `payout_account` (
	`user_id` text PRIMARY KEY NOT NULL,
	`bank_code` text NOT NULL,
	`bank_name` text NOT NULL,
	`account_name` text NOT NULL,
	`last4` text NOT NULL,
	`recipient_code` text NOT NULL,
	`currency` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
