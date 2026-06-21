import { requestPermissionsAsync, getPermissionsAsync } from 'expo-media-library';

export async function requestPhotoLibraryPermission(): Promise<boolean> {
  try {
    const result = await requestPermissionsAsync();
    return result.granted;
  } catch (error) {
    console.error('Failed to request photo library permission:', error);
    return false;
  }
}

export async function checkPhotoLibraryPermission(): Promise<boolean> {
  try {
    const result = await getPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}
