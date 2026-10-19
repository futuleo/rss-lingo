const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web ships a WASM asset that Metro needs to bundle.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// expo-sqlite on web requires cross-origin isolation (SharedArrayBuffer),
// otherwise openDatabaseAsync rejects and the app shows the error gate.
// Official pattern from node_modules/expo-sqlite/skills/expo-sqlite/references/web-and-config.md
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhancedMiddleware = enhanceMiddleware
    ? enhanceMiddleware(middleware, metroServer)
    : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return enhancedMiddleware(req, res, next);
  };
};

module.exports = config;
