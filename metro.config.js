const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('expo/metro-config'); // kept if needed later

const config = getDefaultConfig(__dirname);

module.exports = config;
