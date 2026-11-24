// metro.config.js — EMFILE fix for macOS + Expo 51 + Metro 0.80
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// ─── Fix: EMFILE: too many open files ─────────────────────────────────────────
//
// Metro's NodeWatcher opens one FSEvent handle per file in watched directories.
// With 900+ packages in node_modules this blows past macOS limits.
//
// Strategy:
//  1. Tell Metro ONLY to watch the src/ and app/ directories (project source).
//  2. Block node_modules from being watched at all.
//  3. Metro still *resolves* from node_modules — it just won't watch them.
// ──────────────────────────────────────────────────────────────────────────────

// Only watch actual source directories, not node_modules
config.watchFolders = [
  path.resolve(projectRoot, 'app'),
  path.resolve(projectRoot, 'src'),
];

// Block node_modules tree from the file watcher
const nodeModulesDir = path.resolve(projectRoot, 'node_modules');
config.resolver.blockList = [
  new RegExp(`^${escapeRegex(nodeModulesDir)}\\/.*\\/node_modules\\/.*$`),
];

// Limit parallel workers — fewer open file handles
config.maxWorkers = 2;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = config;
