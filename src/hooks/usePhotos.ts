import { useState, useEffect, useCallback, useRef } from 'react';
import { getPhotos, MediaItem } from '../services/photoLibrary';
import { requestPhotoLibraryPermission } from '../utils/permissions';

interface UsePhotosResult {
  photos: MediaItem[];
  loading: boolean;
  hasNextPage: boolean;
  hasPermission: boolean | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePhotos(): UsePhotosResult {
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [endCursor, setEndCursor] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(false);
  const isLoadingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const loadPhotos = useCallback(
    async (after?: string, append: boolean = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      try {
        setLoading(true);
        const permitted = await requestPhotoLibraryPermission();
        setHasPermission(permitted);

        if (!permitted) {
          return;
        }

        const result = await getPhotos(100, after);
        setPhotos((prev) =>
          append ? [...prev, ...result.items] : result.items,
        );
        setHasNextPage(result.hasNextPage);
        setEndCursor(result.endCursor);
      } catch (error) {
        console.error('Failed to load photos:', error);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [],
  );

  const loadMore = useCallback(async () => {
    if (endCursor && hasNextPage && !isLoadingRef.current && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      try {
        await loadPhotos(endCursor, true);
      } finally {
        isLoadingMoreRef.current = false;
      }
    }
  }, [endCursor, hasNextPage, loadPhotos]);

  const refresh = useCallback(async () => {
    await loadPhotos(undefined, false);
  }, [loadPhotos]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  return { photos, loading, hasNextPage, hasPermission, loadMore, refresh };
}
