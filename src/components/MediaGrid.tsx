import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  View,
  Text,
} from 'react-native';
import { MediaItem, GalleryItem } from '../services/photoLibrary';
import { getVideoThumbnail } from '../services/httpServer';
import { cacheDirectory } from 'expo-file-system/legacy';

const NUM_COLUMNS = 3;
const SPACING = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_SIZE = (SCREEN_WIDTH - SPACING * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface MediaGridProps {
  items: GalleryItem[];
  onSelect: (item: MediaItem) => void;
  onLoadMore: () => void;
  hasNextPage: boolean;
  loading: boolean;
  isDarkMode: boolean;
}

function PhotoTile({
  item,
  onPress,
}: {
  item: MediaItem;
  onPress: (item: MediaItem) => void;
}) {
  const [thumbUri, setThumbUri] = useState(item.type === 'photo' ? item.uri : null);

  useEffect(() => {
    if (item.type === 'video') {
      let cancelled = false;
      getVideoThumbnail(item.uri, cacheDirectory!).then((uri) => {
        if (!cancelled && uri) setThumbUri(uri);
      });
      return () => { cancelled = true; };
    }
  }, [item.uri, item.type]);

  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: thumbUri ?? item.uri }}
        style={styles.thumbnail}
      />
      {item.type === 'video' && (
        <View style={styles.videoBadge}>
          <Text style={styles.videoBadgeText}>▶</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function YearHeader({ year, isDarkMode }: { year: number; isDarkMode: boolean }) {
  return (
    <View style={styles.header}>
      <Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>{year}</Text>
    </View>
  );
}

function PhotoRow({
  items,
  onSelect,
}: {
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
}) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <PhotoTile key={item.uri} item={item} onPress={onSelect} />
      ))}
    </View>
  );
}

export function MediaGrid({
  items,
  onSelect,
  onLoadMore,
  hasNextPage,
  loading,
  isDarkMode,
}: MediaGridProps) {
  const renderItem = useCallback(
    ({ item }: { item: GalleryItem }) => {
      if (item.type === 'header') {
        return <YearHeader year={item.year} isDarkMode={isDarkMode} />;
      }
      return <PhotoRow items={item.items} onSelect={onSelect} />;
    },
    [onSelect, isDarkMode],
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      onEndReached={hasNextPage ? onLoadMore : undefined}
      onEndReachedThreshold={0.3}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: SPACING * 2,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  headerTextDark: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: SPACING / 2,
  },
  tile: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: SPACING / 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 12,
  },
});
