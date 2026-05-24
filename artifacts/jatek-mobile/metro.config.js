const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ignoredDirs = [
  path.resolve(workspaceRoot, ".local"),
  path.resolve(workspaceRoot, ".git"),
  path.resolve(workspaceRoot, "dist"),
  path.resolve(workspaceRoot, "build"),
];
config.resolver.blockList = ignoredDirs.map(
  (d) => new RegExp(`^${escapeRegExp(d)}(/.*)?$`),
);

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Shim Node.js built-ins that some deps (e.g. expo-notifications → @ide/backoff)
// attempt to require but don't exist in the React Native bundle environment.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  assert: path.resolve(projectRoot, "node_modules/assert"),
};

module.exports = config;
