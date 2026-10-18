const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web ships a WASM asset that Metro needs to bundle.
config.resolver.assetExts.push('wasm');

module.exports = config;
