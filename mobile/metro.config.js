// metro.config.js — Expo 51 + Metro 0.80
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// ─── Watch roots ──────────────────────────────────────────────────────────────
//
// Metro must index the project root so it can resolve packages from
// node_modules. Watching *only* app/ and src/ makes every dependency
// unresolvable ("Unable to resolve module ./node_modules/expo-router/entry.js").
//
// EMFILE ("too many open files") on macOS is handled by Watchman when it is
// installed, so we keep the default root and limit the worker count instead of
// hiding node_modules from the file map.
config.watchFolders = [projectRoot];

// Fewer parallel workers — fewer open file handles on macOS.
config.maxWorkers = 2;

module.exports = config;
