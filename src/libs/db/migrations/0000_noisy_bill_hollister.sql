CREATE TABLE `app_error` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`stack` text,
	`component_stack` text,
	`route` text,
	`severity` text NOT NULL,
	`occurred_at` text NOT NULL
);
