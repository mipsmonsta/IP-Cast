import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GalleryScreen } from './src/screens/GalleryScreen';
import { MediaPreviewScreen } from './src/screens/MediaPreviewScreen';
import type { MediaItem } from './src/services/photoLibrary';

export type RootStackParamList = {
  Gallery: undefined;
  MediaPreview: { photos: MediaItem[]; initialIndex: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Gallery"
          screenOptions={{
            headerStyle: {
              backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
            },
            headerTintColor: isDarkMode ? '#fff' : '#1a1a1a',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}>
          <Stack.Screen
            name="Gallery"
            component={GalleryScreen}
            options={{ title: 'Media' }}
          />
          <Stack.Screen
            name="MediaPreview"
            component={MediaPreviewScreen}
            options={{
              title: 'Cast',
              headerStyle: {
                backgroundColor: '#000',
              },
              headerTintColor: '#fff',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
