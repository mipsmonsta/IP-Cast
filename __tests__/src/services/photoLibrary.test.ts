jest.mock('expo-media-library', () => ({}));

import { groupPhotos, MediaItem } from '../../../src/services/photoLibrary';

function makePhoto(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    uri: 'file://photo.jpg',
    type: 'photo',
    filename: 'photo.jpg',
    width: 100,
    height: 100,
    timestamp: 0,
    ...overrides,
  };
}

function timestamp(year: number, month = 0, day = 1): number {
  return Date.UTC(year, month, day);
}

describe('groupPhotos', () => {
  it('returns empty array for empty input', () => {
    expect(groupPhotos([])).toEqual([]);
  });

  it('creates one header and one row for a single photo', () => {
    const items = [makePhoto({ uri: 'a', timestamp: timestamp(2024) })];
    const result = groupPhotos(items);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ type: 'header', year: 2024 });
    expect(result[1]).toMatchObject({ type: 'row' });
    expect((result[1] as { type: 'row'; items: MediaItem[] }).items).toHaveLength(1);
  });

  it('groups photos from the same year under a single header', () => {
    const items = [
      makePhoto({ uri: 'a', timestamp: timestamp(2024, 2, 10) }),
      makePhoto({ uri: 'b', timestamp: timestamp(2024, 5, 15) }),
    ];
    const result = groupPhotos(items);

    const headers = result.filter((g) => g.type === 'header');
    expect(headers).toHaveLength(1);
    expect(headers[0]).toMatchObject({ year: 2024 });
  });

  it('chunks photos into rows of 3', () => {
    const items = [
      makePhoto({ uri: 'a', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'b', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'c', timestamp: timestamp(2024) }),
    ];
    const result = groupPhotos(items);

    // 1 header + 1 row
    expect(result).toHaveLength(2);
    const row = result[1] as { type: 'row'; items: MediaItem[] };
    expect(row.items).toHaveLength(3);
  });

  it('splits 4 photos into two rows (3 + 1)', () => {
    const items = [
      makePhoto({ uri: 'a', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'b', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'c', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'd', timestamp: timestamp(2024) }),
    ];
    const result = groupPhotos(items);

    expect(result).toHaveLength(3); // header + 2 rows
    const rows = result.filter((g) => g.type === 'row') as { type: 'row'; items: MediaItem[] }[];
    expect(rows[0].items).toHaveLength(3);
    expect(rows[1].items).toHaveLength(1);
  });

  it('splits 5 photos into two rows (3 + 2)', () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makePhoto({ uri: String(i), timestamp: timestamp(2024) }),
    );
    const result = groupPhotos(items);

    const rows = result.filter((g) => g.type === 'row') as { type: 'row'; items: MediaItem[] }[];
    expect(rows).toHaveLength(2);
    expect(rows[0].items).toHaveLength(3);
    expect(rows[1].items).toHaveLength(2);
  });

  it('sorts years newest-first', () => {
    const items = [
      makePhoto({ uri: 'old', timestamp: timestamp(2022) }),
      makePhoto({ uri: 'new', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'mid', timestamp: timestamp(2023) }),
    ];
    const result = groupPhotos(items);

    const headers = result.filter((g) => g.type === 'header');
    expect(headers).toHaveLength(3);
    expect((headers[0] as { type: 'header'; year: number }).year).toBe(2024);
    expect((headers[1] as { type: 'header'; year: number }).year).toBe(2023);
    expect((headers[2] as { type: 'header'; year: number }).year).toBe(2022);
  });

  it('produces correct id format for headers', () => {
    const items = [makePhoto({ timestamp: timestamp(2024) })];
    const result = groupPhotos(items);

    expect(result[0].id).toBe('hdr-2024');
  });

  it('produces correct id format for rows', () => {
    const items = [
      makePhoto({ uri: 'a', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'b', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'c', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'd', timestamp: timestamp(2024) }),
    ];
    const result = groupPhotos(items);

    const rows = result.filter((g) => g.type === 'row');
    expect(rows[0].id).toBe('row-2024-0');
    expect(rows[1].id).toBe('row-2024-3');
  });

  it('correctly splits photos across multiple years', () => {
    const items = [
      makePhoto({ uri: 'a', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'b', timestamp: timestamp(2024) }),
      makePhoto({ uri: 'c', timestamp: timestamp(2023) }),
      makePhoto({ uri: 'd', timestamp: timestamp(2023) }),
    ];
    const result = groupPhotos(items);

    // 2024 header, row of 2024 photos, 2023 header, row of 2023 photos
    const expectedTypes = result.map((g) => g.type);
    expect(expectedTypes).toEqual(['header', 'row', 'header', 'row']);
  });

  it('handles 10 photos in one year (3 rows of 3 + 1 row of 1)', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makePhoto({ uri: String(i), timestamp: timestamp(2024) }),
    );
    const result = groupPhotos(items);

    const rows = result.filter((g) => g.type === 'row') as { type: 'row'; items: MediaItem[] }[];
    expect(rows).toHaveLength(4);
    expect(rows[0].items).toHaveLength(3);
    expect(rows[1].items).toHaveLength(3);
    expect(rows[2].items).toHaveLength(3);
    expect(rows[3].items).toHaveLength(1);
  });
});
