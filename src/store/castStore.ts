import { create } from 'zustand';

export type CastState =
  | 'no_devices_available'
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'playing'
  | 'paused';

export interface CastDevice {
  id: string;
  name: string;
  modelName?: string;
}

interface CastStore {
  castState: CastState;
  castDevice: CastDevice | null;
  selectedMedia: {
    uri: string;
    type: 'photo' | 'video';
    filename: string;
  } | null;
  isServerRunning: boolean;
  localServerUrl: string | null;

  setCastState: (state: CastState) => void;
  setCastDevice: (device: CastDevice | null) => void;
  setSelectedMedia: (
    media: { uri: string; type: 'photo' | 'video'; filename: string } | null,
  ) => void;
  setServerRunning: (running: boolean) => void;
  setLocalServerUrl: (url: string | null) => void;
  reset: () => void;
}

const initialState = {
  castState: 'not_connected' as CastState,
  castDevice: null,
  selectedMedia: null,
  isServerRunning: false,
  localServerUrl: null,
};

export const useCastStore = create<CastStore>((set) => ({
  ...initialState,

  setCastState: (castState) => set({ castState }),
  setCastDevice: (castDevice) => set({ castDevice }),
  setSelectedMedia: (selectedMedia) => set({ selectedMedia }),
  setServerRunning: (isServerRunning) => set({ isServerRunning }),
  setLocalServerUrl: (localServerUrl) => set({ localServerUrl }),
  reset: () => set(initialState),
}));
