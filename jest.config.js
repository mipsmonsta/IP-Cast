const preset = require('@react-native/jest-preset/jest-preset');

module.exports = {
  ...preset,
  setupFiles: [
    ...preset.setupFiles,
    '<rootDir>/jest-setup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-safe-area-context|react-native-screens|expo-network|expo-modules-core|expo-media-library|expo-file-system|expo)/)',
  ],
};
