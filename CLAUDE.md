# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

```bash
# Start the Expo dev server (Metro)
npx expo start

# Prebuild native projects (regenerate ios/ and android/ from app.config.js)
npx expo prebuild --clean

# Run on device/simulator (after prebuild)
npx expo run:ios
npx expo run:android

# Lint and test
npm run lint
npm test

# Install pods after native dependency changes
cd ios && pod install
```

## Architecture

**IpCast** is an Expo SDK 56 / React Native 0.86 app that browses the device photo library and casts photos/videos to Google Cast (Chromecast) devices. It serves media from a local HTTP server (GCDWebServer on iOS) so the Cast receiver can pull content directly from the device over the local network.

| Layer | Purpose |
|-------|---------|
| `App.tsx` | Entry point: wraps app in `SafeAreaProvider`, `NavigationContainer`, and a native stack navigator with two screens |
| `src/screens/` | `GalleryScreen` (photo library browser) and `MediaPreviewScreen` (media viewer + cast controls) |
| `src/components/` | `MediaGrid` (3-col FlatList), `CastStatusBar` (native cast button + status), `CastDevicePicker` (unused modal picker) |
| `src/hooks/` | `usePhotos` (pagination), `useCast` (cast session orchestration), `useHttpServer` (unused wrapper) |
| `src/services/` | `photoLibrary.ts` (expo-media-library), `castService.ts` (Google Cast SDK), `httpServer.ts` (native module bridge) |
| `src/store/` | Single Zustand store (`castStore.ts`) holding cast state, device, selected media, and server URL |
| `modules/local-media-server/` | iOS native module (GCDWebServer) — `.h`/`.m` files serve media files over HTTP |
| `plugins/withLocalMediaServer.js` | Expo config plugin that copies the native module files into the Xcode project and adds the GCDWebServer pod |

### Navigation

`GalleryScreen` (initial) → tap thumbnail → `setSelectedMedia` in Zustand → `navigation.navigate('MediaPreview')` → `MediaPreviewScreen` reads `selectedMedia` and shows cast controls.

### Cast flow

1. User picks a Cast device via the native `CastButton` (react-native-google-cast)
2. `useCast` syncs cast state to Zustand store
3. On `castMedia()`: local HTTP server starts on port 8099 → media URL built from local IP → `loadMedia()` on the Cast session

### State (Zustand)

Single store (`src/store/castStore.ts`) with: `castState`, `castDevice`, `selectedMedia`, `isServerRunning`, `localServerUrl`. No middleware or persistence.

## Prebuild and native setup

- `npx expo prebuild --clean` regenerates `ios/` and `android/` from `app.config.js`. The `withLocalMediaServer` plugin copies the native GCDWebServer files and injects the pod dependency into the Podfile automatically.
- If prebuild fails with "ENOENT: no such file or directory ... Supporting/Expo.plist", the `ios/` directory is in a broken state — run `npx expo prebuild --clean`.
- Xcode command-line tools must be set up: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

## Dead code

- `src/components/CastDevicePicker.tsx` — modal device picker, never imported
- `src/hooks/useHttpServer.ts` — convenience wrapper around httpServer service, never imported
