import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useRoute } from '@react-navigation/native';
import { copyAsync, deleteAsync, cacheDirectory } from 'expo-file-system/legacy';
import { CastStatusBar } from '../components/CastButton';
import { useCast } from '../hooks/useCast';
import { useCastStore } from '../store/castStore';
import type { MediaItem } from '../services/photoLibrary';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';

type MediaPreviewScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MediaPreview'>;
};

function VideoPreview({ uri }: { uri: string }) {
  const [localUri, setLocalUri] = useState(uri);
  const player = useVideoPlayer({ uri: localUri });

  useEffect(() => {
    let cancelled = false;
    const localPath = cacheDirectory + `vid_${Date.now()}.mp4`;
    setLocalUri(uri); // reset to original while copying
    copyAsync({ from: uri, to: localPath }).then(() => {
      if (!cancelled) setLocalUri(localPath);
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (localPath) {
        deleteAsync(localPath, { idempotent: true }).catch(() => {});
      }
    };
  }, [uri]);

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
      contentFit="contain"
    />
  );
}

export function MediaPreviewScreen({ navigation }: MediaPreviewScreenProps) {
  const route = useRoute<RouteProp<RootStackParamList, 'MediaPreview'>>();
  const params = route.params;

  const { selectedMedia, setSelectedMedia } = useCastStore();
  const { castState: googleCastState, castMedia, disconnect } = useCast();
  const [isCasting, setIsCasting] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  const photos: MediaItem[] = params?.photos ?? [];
  const initialIndex = params?.initialIndex ?? 0;

  // If navigated with params, show the pager. Otherwise fall back to the
  // single selectedMedia from the store (e.g., deep link without params).
  const hasPager = photos.length > 0;

  const handlePageChange = useCallback(
    (index: number) => {
      if (index >= 0 && index < photos.length) {
        const item = photos[index];
        setSelectedMedia({
          uri: item.uri,
          type: item.type,
          filename: item.filename || 'media',
        });
      }
    },
    [photos, setSelectedMedia],
  );

  const handleCast = useCallback(async () => {
    if (!selectedMedia) return;

    try {
      setIsCasting(true);
      await castMedia();
    } catch (error: any) {
      Alert.alert(
        'Cast Error',
        error.message || 'Failed to cast media. Ensure you are connected to a Cast device first.',
      );
    } finally {
      setIsCasting(false);
    }
  }, [selectedMedia, castMedia]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

  if (!selectedMedia && !hasPager) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No media selected.</Text>
      </View>
    );
  }

  // The currently displayed item (from store or pager)
  const displayItem = selectedMedia;

  return (
    <View style={styles.container}>
      <View style={styles.previewContainer}>
        {hasPager ? (
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            initialScrollIndex={initialIndex}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            keyExtractor={(item) => item.uri}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / screenWidth,
              );
              handlePageChange(index);
            }}
            renderItem={({ item }) => (
              <View style={{ width: screenWidth }}>
                {item.type === 'video' ? (
                  <VideoPreview uri={item.uri} />
                ) : (
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                )}
              </View>
            )}
          />
        ) : displayItem ? (
          displayItem.type === 'video' ? (
            <VideoPreview uri={displayItem.uri} />
          ) : (
            <Image
              source={{ uri: displayItem.uri }}
              style={styles.image}
              resizeMode="contain"
            />
          )
        ) : null}
      </View>

      <View style={styles.infoBar}>
        <View style={styles.infoText}>
          <Text style={styles.filename} numberOfLines={1}>
            {displayItem?.filename ?? ''}
          </Text>
          <Text style={styles.typeTag}>
            {displayItem?.type === 'video' ? 'Video' : 'Photo'}
          </Text>
        </View>
        {isCasting && (
          <ActivityIndicator size="small" color="#1a73e8" style={styles.spinner} />
        )}
      </View>

      <View style={styles.controls}>
        <CastStatusBar
          castState={googleCastState}
          isCasting={isCasting}
          onDisconnect={handleDisconnect}
        />
        {googleCastState === 'connected' && !isCasting && (
          <TouchableOpacity
            style={styles.castButton}
            onPress={handleCast}
            activeOpacity={0.8}
          >
            <Text style={styles.castButtonText}>Cast to TV</Text>
          </TouchableOpacity>
        )}
        {isCasting && (
          <Text style={styles.hint}>
            Casting to your TV...
          </Text>
        )}
        {!googleCastState || googleCastState === 'notConnected' ||
        googleCastState === 'noDevicesAvailable' ? (
          <Text style={styles.hint}>
            Tap above to discover and connect to a device
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  infoText: {
    flex: 1,
  },
  filename: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  typeTag: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  spinner: {
    marginLeft: 8,
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  hint: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  castButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  castButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
