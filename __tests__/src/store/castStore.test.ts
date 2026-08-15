import { useCastStore } from '../../../src/store/castStore';

describe('castStore', () => {
  beforeEach(() => {
    useCastStore.getState().reset();
  });

  describe('initial state', () => {
    it('has castState not_connected', () => {
      expect(useCastStore.getState().castState).toBe('not_connected');
    });

    it('has no cast device', () => {
      expect(useCastStore.getState().castDevice).toBeNull();
    });

    it('has no selected media', () => {
      expect(useCastStore.getState().selectedMedia).toBeNull();
    });

    it('has server not running', () => {
      expect(useCastStore.getState().isServerRunning).toBe(false);
    });

    it('has no local server URL', () => {
      expect(useCastStore.getState().localServerUrl).toBeNull();
    });
  });

  describe('setCastState', () => {
    it.each([
      'no_devices_available',
      'not_connected',
      'connecting',
      'connected',
      'playing',
      'paused',
    ] as const)('transitions to %s', (state) => {
      useCastStore.getState().setCastState(state);
      expect(useCastStore.getState().castState).toBe(state);
    });
  });

  describe('setCastDevice', () => {
    it('sets a device', () => {
      const device = { id: 'abc', name: 'Living Room TV', modelName: 'Chromecast' };
      useCastStore.getState().setCastDevice(device);
      expect(useCastStore.getState().castDevice).toEqual(device);
    });

    it('clears the device with null', () => {
      useCastStore.getState().setCastDevice({ id: 'abc', name: 'TV' });
      useCastStore.getState().setCastDevice(null);
      expect(useCastStore.getState().castDevice).toBeNull();
    });

    it('accepts a device without modelName', () => {
      const device = { id: 'xyz', name: 'Bedroom' };
      useCastStore.getState().setCastDevice(device);
      expect(useCastStore.getState().castDevice?.modelName).toBeUndefined();
    });
  });

  describe('setSelectedMedia', () => {
    it('sets selected media', () => {
      const media = { uri: 'file://video.mp4', type: 'video' as const, filename: 'video.mp4' };
      useCastStore.getState().setSelectedMedia(media);
      expect(useCastStore.getState().selectedMedia).toEqual(media);
    });

    it('clears selected media with null', () => {
      useCastStore.getState().setSelectedMedia({ uri: 'a', type: 'photo', filename: 'a.jpg' });
      useCastStore.getState().setSelectedMedia(null);
      expect(useCastStore.getState().selectedMedia).toBeNull();
    });
  });

  describe('setServerRunning', () => {
    it('sets server as running', () => {
      useCastStore.getState().setServerRunning(true);
      expect(useCastStore.getState().isServerRunning).toBe(true);
    });

    it('sets server as stopped', () => {
      useCastStore.getState().setServerRunning(true);
      useCastStore.getState().setServerRunning(false);
      expect(useCastStore.getState().isServerRunning).toBe(false);
    });
  });

  describe('setLocalServerUrl', () => {
    it('sets the server URL', () => {
      useCastStore.getState().setLocalServerUrl('http://192.168.1.5:8099/media');
      expect(useCastStore.getState().localServerUrl).toBe('http://192.168.1.5:8099/media');
    });

    it('clears the server URL with null', () => {
      useCastStore.getState().setLocalServerUrl('http://192.168.1.5:8099/media');
      useCastStore.getState().setLocalServerUrl(null);
      expect(useCastStore.getState().localServerUrl).toBeNull();
    });
  });

  describe('reset', () => {
    it('restores all fields to initial state', () => {
      const store = useCastStore.getState();
      store.setCastState('connected');
      store.setCastDevice({ id: 'd1', name: 'TV' });
      store.setSelectedMedia({ uri: 'x', type: 'photo', filename: 'x.jpg' });
      store.setServerRunning(true);
      store.setLocalServerUrl('http://1.2.3.4:8099/media');

      store.reset();

      expect(useCastStore.getState().castState).toBe('not_connected');
      expect(useCastStore.getState().castDevice).toBeNull();
      expect(useCastStore.getState().selectedMedia).toBeNull();
      expect(useCastStore.getState().isServerRunning).toBe(false);
      expect(useCastStore.getState().localServerUrl).toBeNull();
    });
  });

  describe('independent updates', () => {
    it('updating castState does not affect other fields', () => {
      useCastStore.getState().setCastDevice({ id: 'd', name: 'TV' });
      useCastStore.getState().setCastState('playing');

      expect(useCastStore.getState().castDevice).toEqual({ id: 'd', name: 'TV' });
      expect(useCastStore.getState().selectedMedia).toBeNull();
    });

    it('updating selectedMedia does not affect cast state', () => {
      useCastStore.getState().setCastState('connected');
      useCastStore.getState().setSelectedMedia({ uri: 'u', type: 'video', filename: 'v.mp4' });

      expect(useCastStore.getState().castState).toBe('connected');
    });
  });
});
