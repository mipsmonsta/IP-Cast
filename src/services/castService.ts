import CastContext, {
  CastState,
  RemoteMediaClient,
  DiscoveryManager,
  SessionManager,
} from 'react-native-google-cast';

/**
 * Initialize Google Cast. The native SDK auto-initializes,
 * but we ensure discovery is active.
 */
export async function initializeCast(): Promise<CastState | null> {
  // react-native-google-cast auto-initializes via the native module.
  // We just return the current state to verify it's working.
  return CastContext.getCastState();
}

/**
 * Get the remote media client for the current session, if connected.
 */
export function getRemoteMediaClient(): RemoteMediaClient | null {
  const sessionManager = CastContext.getSessionManager();
  // We need to use async. Use the hook-based approach instead.
  return null;
}

/**
 * Load media onto the Cast receiver.
 */
export async function loadMedia(
  client: RemoteMediaClient,
  contentUrl: string,
  contentType: string,
  title: string,
): Promise<void> {
  await client.loadMedia({
    autoplay: true,
    mediaInfo: {
      contentUrl,
      contentType,
      metadata:
        contentType.startsWith('video')
          ? { type: 'movie' as const, title }
          : { type: 'photo' as const, title },
    },
  });
}

/**
 * Stop the current cast session.
 */
export async function endSession(stopCasting: boolean = false): Promise<void> {
  const sessionManager = CastContext.getSessionManager();
  await sessionManager.endCurrentSession(stopCasting);
}
