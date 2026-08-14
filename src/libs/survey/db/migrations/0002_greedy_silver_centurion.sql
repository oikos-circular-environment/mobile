CREATE TABLE `survey_protocol_cache` (
	`protocol_key` text PRIMARY KEY NOT NULL,
	`protocol_version` integer NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
