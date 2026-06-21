import * as Network from 'expo-network';

let cachedIP: string | null = null;

export function getLocalIPAddress(): string {
  return cachedIP ?? '127.0.0.1';
}

export async function resolveLocalIPAddress(): Promise<string> {
  try {
    const ip = await Network.getIpAddressAsync();
    cachedIP = ip !== '0.0.0.0' ? ip : '127.0.0.1';
    return cachedIP;
  } catch {
    cachedIP = '127.0.0.1';
    return cachedIP;
  }
}

export function buildMediaUrl(ip: string, port: number): string {
  return `http://${ip}:${port}/media`;
}
