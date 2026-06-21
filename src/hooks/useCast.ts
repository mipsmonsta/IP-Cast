import { useEffect, useCallback, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { copyAsync, deleteAsync, cacheDirectory } from 'expo-file-system/legacy';
import {
  useCastState,
  useRemoteMediaClient,
  useCastSession,
  CastState,
} from 'react-native-google-cast';
import { loadMedia, endSession } from '../services/castService';
import { startServer, stopServer, getServerPort } from '../services/httpServer';
import { resolveLocalIPAddress } from '../utils/network';
import { useCastStore } from '../store/castStore';

export function useCast() {
  const castState = useCastState();
  const client = useRemoteMediaClient();
  const castSession = useCastSession();
  const { selectedMedia, setCastState, setCastDevice, setLocalServerUrl } =
    useCastStore();
  const [error, setError] = useState<string | null>(null);
  const [tempFilePath, setTempFilePath] = useState<string | null>(null);
  const prevTempFileRef = useRef<string | null>(null);

  // Sync Google Cast state to our Zustand store
  useEffect(() => {
    if (!castState) return;

    switch (castState) {
      case CastState.CONNECTED:
        setCastState('connected');
        break;
      case CastState.CONNECTING:
        setCastState('connecting');
        break;
      case CastState.NO_DEVICES_AVAILABLE:
        setCastState('no_devices_available');
        break;
      case CastState.NOT_CONNECTED:
        setCastState('not_connected');
        break;
    }
  }, [castState, setCastState]);

  // Resolve local IP on mount for casting
  useEffect(() => {
    resolveLocalIPAddress();
  }, []);

  // Keep HTTP server running in background during active cast
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background' && castState !== CastState.CONNECTED) {
        stopServer();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [castState]);

  // Clean up temp file on unmount
  useEffect(() => {
    return () => {
      if (prevTempFileRef.current) {
        deleteAsync(prevTempFileRef.current, { idempotent: true }).catch(() => {});
        prevTempFileRef.current = null;
      }
    };
  }, []);

  const castMedia = useCallback(async () => {
    if (!selectedMedia) {
      throw new Error('No media selected');
    }

    if (!client) {
      throw new Error(
        'Not connected to a Cast device. Please connect first.',
      );
    }

    setError(null);

    await resolveLocalIPAddress();
    const port = getServerPort();

    const contentType =
      selectedMedia.type === 'video' ? 'video/mp4' : 'image/jpeg';

    // Delete the previous temp file before creating a new one
    if (prevTempFileRef.current) {
      deleteAsync(prevTempFileRef.current, { idempotent: true }).catch(() => {});
    }

    // Copy asset from photo library to a temp file so the HTTP server
    // can serve it as a real filesystem path.
    const ext = selectedMedia.type === 'video' ? 'mp4' : 'jpg';
    const localPath = cacheDirectory + `ipcast_${Date.now()}.${ext}`;

    await copyAsync({
      from: selectedMedia.uri,
      to: localPath,
    });

    prevTempFileRef.current = localPath;
    setTempFilePath(localPath);

    const serverUrl = await startServer({
      port,
      filePath: localPath,
      contentType,
    });

    setLocalServerUrl(serverUrl);

    // Append cache-buster so the Cast device fetches fresh content each time
    const cacheBustUrl = serverUrl.replace(/\/$/, '') + `?t=${Date.now()}`;
    await loadMedia(client, cacheBustUrl, contentType, selectedMedia.filename);
  }, [selectedMedia, client, setLocalServerUrl]);

  const disconnect = useCallback(async () => {
    try {
      await stopServer();
      if (prevTempFileRef.current) {
        await deleteAsync(prevTempFileRef.current, { idempotent: true });
        prevTempFileRef.current = null;
        setTempFilePath(null);
      }
      await endSession(false);
    } catch (err) {
      console.warn('Error disconnecting:', err);
    } finally {
      setLocalServerUrl(null);
      setCastDevice(null);
      setCastState('not_connected');
    }
  }, [setLocalServerUrl, setCastDevice, setCastState, tempFilePath]);

  return {
    castState,
    client,
    castSession,
    error,
    castMedia,
    disconnect,
  };
}
