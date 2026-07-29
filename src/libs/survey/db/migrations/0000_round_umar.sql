CREATE TABLE `survey_answer` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`suite_run_id` text,
	`question_key` text NOT NULL,
	`value_text` text,
	`value_number` integer,
	FOREIGN KEY (`session_id`) REFERENCES `survey_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`suite_run_id`) REFERENCES `survey_suite_run`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `survey_event` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`suite_run_id` text,
	`seq` integer NOT NULL,
	`type` text NOT NULL,
	`task_code` text,
	`occurred_at` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `survey_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`suite_run_id`) REFERENCES `survey_suite_run`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `survey_event_session_seq` ON `survey_event` (`session_id`,`seq`);--> statement-breakpoint
CREATE TABLE `survey_session` (
	`id` text PRIMARY KEY NOT NULL,
	`protocol_key` text NOT NULL,
	`protocol_version` integer NOT NULL,
	`persona` text NOT NULL,
	`participant_code` text,
	`state_uf` text NOT NULL,
	`city_name` text NOT NULL,
	`age_range` text NOT NULL,
	`education_level` text NOT NULL,
	`chain_role` text NOT NULL,
	`waste_contact_frequency` integer NOT NULL,
	`app_experience` integer NOT NULL,
	`consent_version` text NOT NULL,
	`consent_at` text NOT NULL,
	`device_os` text NOT NULL,
	`device_os_version` text NOT NULL,
	`app_version` text NOT NULL,
	`screen_size` text NOT NULL,
	`status` text DEFAULT 'IN_PROGRESS' NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`active_ms` integer DEFAULT 0 NOT NULL,
	`wall_ms` integer DEFAULT 0 NOT NULL,
	`abandon_reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `survey_suite_run` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`suite_code` text NOT NULL,
	`position` integer NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`active_ms` integer DEFAULT 0 NOT NULL,
	`wall_ms` integer DEFAULT 0 NOT NULL,
	`outcome` text,
	`synced` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `survey_session`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `survey_suite_run_session_suite` ON `survey_suite_run` (`session_id`,`suite_code`);--> statement-breakpoint
CREATE TABLE `survey_task_run` (
	`id` text PRIMARY KEY NOT NULL,
	`suite_run_id` text NOT NULL,
	`task_code` text NOT NULL,
	`position` integer NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`active_ms` integer DEFAULT 0 NOT NULL,
	`outcome` text,
	`auto_detected` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`suite_run_id`) REFERENCES `survey_suite_run`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `survey_task_run_suite_task` ON `survey_task_run` (`suite_run_id`,`task_code`);