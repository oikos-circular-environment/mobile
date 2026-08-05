const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Necessário para o drizzle-kit importar as migrações do modo pesquisa como texto
// (drizzle-orm/expo-sqlite/migrator): https://orm.drizzle.team/quick-sqlite/expo
config.resolver.sourceExts.push("sql");

module.exports = withNativewind(config);
