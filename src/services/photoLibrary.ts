import { Query, Asset, AssetField, SortDescriptor, MediaType } from 'expo-media-library';

export interface MediaItem {
  uri: string;
  type: 'photo' | 'video';
  filename: string;
  width: number;
  height: number;
  duration?: number;
  timestamp: number;
}

export type GalleryItem =
  | { id: string; type: 'header'; year: number }
  | { id: string; type: 'row'; items: MediaItem[] };

/**
 * Group a flat array of MediaItems into year sections with row-of-3 chunks,
 * sorted newest-first. Returns a renderable array of headers and rows
 * suitable for a FlatList without numColumns.
 */
export function groupPhotos(items: MediaItem[]): GalleryItem[] {
  const byYear = new Map<number, MediaItem[]>();

  for (const item of items) {
    const year = new Date(item.timestamp).getFullYear();
    const list = byYear.get(year);
    if (list) {
      list.push(item);
    } else {
      byYear.set(year, [item]);
    }
  }

  const years = [...byYear.keys()].sort((a, b) => b - a);
  const result: GalleryItem[] = [];

  for (const year of years) {
    const photos = byYear.get(year)!;
    result.push({ id: `hdr-${year}`, type: 'header', year });

    for (let i = 0; i < photos.length; i += 3) {
      result.push({
        id: `row-${year}-${i}`,
        type: 'row',
        items: photos.slice(i, i + 3),
      });
    }
  }

  return result;
}

export async function getPhotos(
  count: number = 50,
  after?: string,
): Promise<{ items: MediaItem[]; hasNextPage: boolean; endCursor?: string }> {
  const offset = after ? parseInt(after, 10) : 0;

  const query = new Query()
    .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
    .limit(count + 1)
    .offset(offset);

  const assets = await query.exe();

  const hasNextPage = assets.length > count;
  if (hasNextPage) {
    assets.pop();
  }

  const items = await Promise.all(
    assets.map(async (asset) => {
      const [uri, filename, mediaType, width, height, duration, creationTime] =
        await Promise.all([
          asset.getUri(),
          asset.getFilename(),
          asset.getMediaType(),
          asset.getWidth(),
          asset.getHeight(),
          asset.getDuration(),
          asset.getCreationTime(),
        ]);

      return {
        uri,
        type: mediaType === MediaType.VIDEO ? 'video' as const : 'photo' as const,
        filename: filename || 'untitled',
        width: width || 0,
        height: height || 0,
        duration: duration || undefined,
        timestamp: creationTime || Date.now(),
      };
    }),
  );

  return {
    items,
    hasNextPage,
    endCursor: hasNextPage ? String(offset + count) : undefined,
  };
}

export async function getVideoUri(uri: string): Promise<string> {
  return uri;
}
