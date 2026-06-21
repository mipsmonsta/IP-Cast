import { useState, useCallback } from 'react';
import {
  startServer,
  stopServer,
  HttpServerConfig,
  getServerPort,
} from '../services/httpServer';
import { useCastStore } from '../store/castStore';

interface UseHttpServerResult {
  isStarting: boolean;
  start: (filePath: string, contentType: string) => Promise<string>;
  stop: () => Promise<void>;
}

export function useHttpServer(): UseHttpServerResult {
  const [isStarting, setIsStarting] = useState(false);
  const { setServerRunning, setLocalServerUrl } = useCastStore();

  const start = useCallback(
    async (filePath: string, contentType: string): Promise<string> => {
      setIsStarting(true);
      try {
        const config: HttpServerConfig = {
          port: getServerPort(),
          filePath,
          contentType,
        };

        const url = await startServer(config);
        setServerRunning(true);
        setLocalServerUrl(url);
        return url;
      } finally {
        setIsStarting(false);
      }
    },
    [setServerRunning, setLocalServerUrl],
  );

  const stop = useCallback(async () => {
    await stopServer();
    setServerRunning(false);
    setLocalServerUrl(null);
  }, [setServerRunning, setLocalServerUrl]);

  return { isStarting, start, stop };
}
