module.exports = {
  expo: {
    name: "IpCast",
    slug: "ip-cast",
    version: "0.0.1",
    icon: "./assets/icon.png",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    splash: {
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ipcast.app",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "Access your photos and videos to cast them to your TV.",
        NSLocalNetworkUsageDescription: "Access your local network to serve media to Cast devices.",
        NSBonjourServices: ["_googlecast._tcp", "_googlecast._tls"]
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff"
      },
      package: "com.ipcast.app",
      permissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO"
      ]
    },
    plugins: [
      "react-native-google-cast",
      "./plugins/withLocalMediaServer",
      [
        "expo-media-library",
        {
          "photosPermission": "Access your photos and videos to cast them to your TV.",
          "savePhotosPermission": "Allow IpCast to save media to your library."
        }
      ],
      "expo-video"
    ],
    extra: {}
  }
};
