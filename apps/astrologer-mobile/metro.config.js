const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

process.env.EXPO_ROUTER_APP_ROOT = path.join(__dirname, "app");

module.exports = getDefaultConfig(__dirname);
