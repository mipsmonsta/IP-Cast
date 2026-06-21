import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  CastButton as NativeCastButton,
  CastState,
  CastContext,
} from 'react-native-google-cast';
import type { Props as CastButtonProps } from 'react-native-google-cast/src/components/CastButton';

const stateLabel: Record<string, string> = {
  [CastState.NO_DEVICES_AVAILABLE]: 'No devices found',
  [CastState.NOT_CONNECTED]: 'Tap to connect',
  [CastState.CONNECTING]: 'Connecting...',
  [CastState.CONNECTED]: 'Connected',
};

interface Props {
  castState: string | null | undefined;
  isCasting: boolean;
  onDisconnect: () => void;
}

export function CastStatusBar({ castState, isCasting, onDisconnect }: Props) {
  const isConnected = castState === CastState.CONNECTED;
  const isConnecting = castState === CastState.CONNECTING || isCasting;
  const showCastDialog = useCallback(() => {
    CastContext.showCastDialog();
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={showCastDialog}
      disabled={isConnected || isConnecting}
      activeOpacity={isConnected || isConnecting ? 1 : 0.7}
    >
      {/* Native Cast button for discovery */}
      <View style={styles.nativeButtonWrapper}>
        <NativeCastButton style={styles.nativeButton} tintColor="#fff" />
      </View>

      {/* Status label */}
      {isConnecting ? (
        <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
      ) : null}
      <Text style={styles.label}>
        {stateLabel[castState ?? ''] ?? 'Not connected'}
      </Text>

      {/* Disconnect button */}
      {isConnected && (
        <TouchableOpacity onPress={onDisconnect} style={styles.disconnectBtn}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 115, 232, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 98,
    gap: 8,
  },
  nativeButtonWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeButton: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  spinner: {
    marginRight: 4,
  },
  disconnectBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
  },
  disconnectText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
