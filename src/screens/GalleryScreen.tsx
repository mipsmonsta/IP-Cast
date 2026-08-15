import React, { useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import { MediaGrid } from '../components/MediaGrid';
import { usePhotos } from '../hooks/usePhotos';
import { useCastStore } from '../store/castStore';
import { MediaItem, groupPhotos } from '../services/photoLibrary';
import { deleteStaleThumbnails } from '../services/httpServer';
import { cacheDirectory } from 'expo-file-system/legacy';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type GalleryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Gallery'>;
};

export function GalleryScreen({ navigation }: GalleryScreenProps) {
  const { photos, loading, hasNextPage, loadMore, hasPermission } = usePhotos();
  const { setSelectedMedia } = useCastStore();
  const isDarkMode = useColorScheme() === 'dark';

  const groupedItems = useMemo(() => groupPhotos(photos), [photos]);

  // Clean stale thumbnails for videos no longer in the library
  useEffect(() => {
    if (photos.length === 0 || !cacheDirectory) return;
    const videoUris = photos
      .filter((p) => p.type === 'video')
      .map((p) => p.uri);
    deleteStaleThumbnails(cacheDirectory, videoUris);
  }, [photos]);

  const handleSelect = useCallback(
    (item: MediaItem) => {
      if (!item.uri) {
        Alert.alert('Error', 'Cannot access this media file.');
        return;
      }

      setSelectedMedia({
        uri: item.uri,
        type: item.type,
        filename: item.filename || 'media',
      });

      const initialIndex = photos.findIndex((p) => p.uri === item.uri);
      navigation.navigate('MediaPreview', {
        photos,
        initialIndex: initialIndex >= 0 ? initialIndex : 0,
      });
    },
    [navigation, photos, setSelectedMedia],
  );

  if (hasPermission === false) {
    return (
      <View style={[styles.centered, isDarkMode && styles.centeredDark]}>
        <Text style={[styles.message, isDarkMode && styles.messageDark]}>
          Photo library access is required to browse your media.{'\n'}
          Please grant permission in Settings.
        </Text>
      </View>
    );
  }

  if (loading && photos.length === 0) {
    return (
      <View style={[styles.centered, isDarkMode && styles.centeredDark]}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <MediaGrid
        items={groupedItems}
        onSelect={handleSelect}
        onLoadMore={loadMore}
        hasNextPage={hasNextPage}
        loading={loading}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centeredDark: {
    backgroundColor: '#000',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  messageDark: {
    color: '#aaa',
  },
});
