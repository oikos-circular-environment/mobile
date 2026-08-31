// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from "./0000_minor_pixie.sql";
import m0001 from "./0001_lowly_victor_mancha.sql";
import m0002 from "./0002_greedy_silver_centurion.sql";
import m0003 from "./0003_dry_shard.sql";
import journal from "./meta/_journal.json";

export default {
	journal,
	migrations: {
		m0000,
		m0001,
		m0002,
		m0003,
	},
};
