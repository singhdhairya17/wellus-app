const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver = {
  ...defaultConfig.resolver,
  sourceExts: Array.from(new Set([
    ...defaultConfig.resolver.sourceExts,
    'cjs',
    'mjs',
  ])),
};

// Fix for Windows: Configure watcher to handle missing platform-specific directories
// This prevents Metro from trying to watch non-existent directories
defaultConfig.watchFolders = [
  path.resolve(__dirname),
];

// Exclude problematic platform-specific directories from watching
defaultConfig.resolver.blockList = [
  ...(defaultConfig.resolver.blockList || []),
  // Block platform-specific esbuild directories that may not exist
  /node_modules\/@esbuild\/(linux|darwin|freebsd|netbsd|openbsd|sunos)-.*/,
];

module.exports = defaultConfig;
