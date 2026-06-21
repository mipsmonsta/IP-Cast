# IpCast

Cast photos and videos from your iPhone to Chromecast-enabled TVs and displays.

## Features

- **Photo gallery with year sections** — photos grouped by year with headers, sorted newest first
- **Swipeable preview** — swipe left/right between photos in the preview screen, cast the current photo
- **Cast to TV** — send any photo or video to a Google Cast (Chromecast) device
- **HEIC → JPEG conversion** — iPhone photos are automatically downscaled and converted for Chromecast compatibility
- **Video transcoding** — HEVC/MOV videos are transcoded to H.264 MP4 so they play on any Cast device
- **Video thumbnails** — video tiles in the gallery show auto-generated preview frames with caching
- **Local media server** — serves media directly from your phone over WiFi (no cloud uploads)
- **Cache management** — thumbnails deduplicated by URI, stale files cleaned up automatically

## How it works

1. Browse your photo library organized by year
2. Tap a photo to open the swipeable preview
3. Tap the Cast icon to discover devices on your WiFi (grant local network access when prompted)
4. Select your Chromecast or Cast-enabled TV from the dialog
5. Tap **Cast to TV** — the asset is copied locally, transcoded/converted if needed, served over HTTP, and displayed on your TV
6. Swipe to the next photo and tap Cast again — the TV updates immediately

```
iPhone (photo library) → copy to cache → convert/transcode → HTTP server :8099 → Cast device fetches URL → TV
```

## Getting started

### Prerequisites

- Node.js 22+
- Xcode 17+ (with iOS 26+ simulator or device)
- CocoaPods

### Setup

```bash
npm install
npx expo prebuild --clean
```

### Run on device

```bash
npx expo run:ios --device
```

### Run on simulator

```bash
npx expo run:ios
```

## Architecture

| Layer | Purpose |
|-------|---------|
| `App.tsx` | Entry point with navigation (Gallery → MediaPreview) |
| `src/screens/` | `GalleryScreen` (sectioned photo browser) and `MediaPreviewScreen` (swipeable viewer + cast controls) |
| `src/components/` | `MediaGrid` (year headers + 3-col photo rows), `CastStatusBar` (native cast button + status) |
| `src/hooks/` | `usePhotos` (paginated photo loading, 100 per page), `useCast` (cast session + media server lifecycle) |
| `src/services/` | `photoLibrary.ts` (query + year grouping), `castService.ts`, `httpServer.ts` (native bridge + cache utilities) |
| `src/store/` | Zustand store for cast state, device, selected media |
| `modules/local-media-server/` | iOS native module: GCDWebServer, ImageIO JPEG conversion, AVFoundation video transcoding, video thumbnail generation |
| `plugins/` | Expo config plugin for GCDWebServer pod and native module linking |

## Tech stack

- Expo SDK 56 / React Native 0.85.3
- Google Cast SDK (react-native-google-cast)
- GCDWebServer for local HTTP serving
- ImageIO for memory-safe HEIC → JPEG conversion
- AVFoundation for video transcoding (HEVC/MOV → H.264 MP4) and thumbnail generation
- Zustand for state management
- React Navigation (native stack)
