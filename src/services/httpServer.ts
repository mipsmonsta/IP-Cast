import { NativeModules, Platform } from 'react-native';
import {
  getInfoAsync,
  copyAsync as fsCopyAsync,
  deleteAsync as fsDeleteAsync,
  readDirectoryAsync,
} from 'expo-file-system/legacy';

const { LocalMediaServer } = NativeModules;

export interface HttpServerConfig {
  port: number;
  filePath: string;
  contentType: string;
}

/**
 * Start the local HTTP server to serve a media file.
 * The native module (GCDWebServer on iOS) handles the actual serving.
 */
export async function startServer(config: HttpServerConfig): Promise<string> {
  if (!LocalMediaServer) {
    throw new Error(
      'LocalMediaServer native module not available. ' +
        'Ensure the iOS native module is linked.',
    );
  }

  try {
    const url: string = await LocalMediaServer.startServer(
      config.port,
      config.filePath,
      config.contentType,
    );
    return url;
  } catch (error) {
    throw new Error(
      `Failed to start local media server: ${error}`,
    );
  }
}

export async function stopServer(): Promise<void> {
  if (!LocalMediaServer) {
    return;
  }

  try {
    await LocalMediaServer.stopServer();
  } catch (error) {
    console.warn('Error stopping local media server:', error);
  }
}


export function getServerPort(): number {
  // Use a fixed port range for predictability
  return 8099;
}

export async function generateVideoThumbnail(
  filePath: string,
  maxWidth: number = 300,
): Promise<string | null> {
  if (!LocalMediaServer) return null;
  try {
    return await LocalMediaServer.generateThumbnail(filePath, maxWidth);
  } catch {
    return null;
  }
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

/**
 * Returns a stable thumbnail path for a video URI. If the thumbnail
 * already exists, returns it immediately (no native call).
 * Otherwise generates a new thumbnail and copies it to the stable path.
 */
export async function getVideoThumbnail(
  videoUri: string,
  cacheDir: string,
): Promise<string | null> {
  const stablePath = cacheDir + `thumb_${hashString(videoUri)}.jpg`;

  // Already cached — return immediately
  const info = await getInfoAsync(stablePath);
  if (info.exists) return stablePath;

  // Generate new thumbnail
  const tempPath = await generateVideoThumbnail(videoUri);
  if (!tempPath) return null;

  try {
    await fsCopyAsync({ from: tempPath, to: stablePath });
    await fsDeleteAsync(tempPath, { idempotent: true });
    return stablePath;
  } catch {
    return tempPath;
  }
}

/**
 * Delete thumbnails that don't match any of the given video URIs.
 * Call this when the gallery loads to clean up orphaned thumbnails.
 */
export async function deleteStaleThumbnails(
  cacheDir: string,
  videoUris: string[],
): Promise<void> {
  const expected = new Set(
    videoUris.map((uri) => `thumb_${hashString(uri)}.jpg`),
  );
  try {
    const files: string[] = await readDirectoryAsync(cacheDir);
    for (const file of files) {
      if (file.startsWith('thumb_') && !expected.has(file)) {
        fsDeleteAsync(cacheDir + file, { idempotent: true }).catch(() => {});
      }
    }
  } catch {}
}

/**
 * Remove all temporary files created by the app from the cache directory.
 */
export async function clearMediaCache(cacheDir: string): Promise<void> {
  try {
    const files: string[] = await readDirectoryAsync(cacheDir);
    const patterns = ['ipcast_', 'vid_', 'thumb_'];
    for (const file of files) {
      if (patterns.some((p) => file.startsWith(p))) {
        fsDeleteAsync(cacheDir + file, { idempotent: true }).catch(() => {});
      }
    }
  } catch {}
}
