const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite (web build) imports its wa-sqlite .wasm binary; teach Metro to
// treat .wasm as an asset so the web bundler can resolve it.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;
