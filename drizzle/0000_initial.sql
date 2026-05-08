CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`normalized_url` text NOT NULL,
	`title` text,
	`abstract` text,
	`abstract_zh` text,
	`kind` text DEFAULT 'other' NOT NULL,
	`source` text NOT NULL,
	`source_chat_id` text,
	`source_message_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`tags_text` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_normalized_url_unique` ON `bookmarks` (`normalized_url`);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);
--> statement-breakpoint
CREATE TABLE `bookmark_tags` (
	`bookmark_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookmark_tags_bookmark_id_tag_id_pk` ON `bookmark_tags` (`bookmark_id`,`tag_id`);
--> statement-breakpoint
CREATE TABLE `youtube_meta` (
	`bookmark_id` integer PRIMARY KEY NOT NULL,
	`video_id` text NOT NULL,
	`channel` text,
	`duration_sec` integer,
	`transcript` text,
	`transcript_lang` text,
	`summary` text,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE VIRTUAL TABLE `bookmarks_fts` USING fts5(
	`title`,
	`abstract`,
	`transcript`,
	`summary`,
	`tags_text`,
	tokenize = 'porter unicode61'
);
