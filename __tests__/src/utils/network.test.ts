jest.mock('expo-network', () => ({
  getIpAddressAsync: jest.fn().mockResolvedValue('192.168.1.5'),
}));

import { buildMediaUrl, getLocalIPAddress } from '../../../src/utils/network';

describe('buildMediaUrl', () => {
  it('builds an HTTP URL from IP and port', () => {
    expect(buildMediaUrl('192.168.1.5', 8099)).toBe('http://192.168.1.5:8099/media');
  });

  it('works with localhost', () => {
    expect(buildMediaUrl('127.0.0.1', 3000)).toBe('http://127.0.0.1:3000/media');
  });

  it('works with IPv6 loopback', () => {
    expect(buildMediaUrl('::1', 8080)).toBe('http://::1:8080/media');
  });

  it('works with 10.x private ranges', () => {
    expect(buildMediaUrl('10.0.0.1', 80)).toBe('http://10.0.0.1:80/media');
  });
});

describe('getLocalIPAddress', () => {
  it('falls back to 127.0.0.1 when no IP has been resolved', () => {
    // Module is freshly loaded and resolveLocalIPAddress hasn't been called,
    // so cachedIP is null and we get the fallback.
    expect(getLocalIPAddress()).toBe('127.0.0.1');
  });
});
