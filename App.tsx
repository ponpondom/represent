import 'expo-router/entry';
import * as ExpoSplash from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

// Prevent the native splash screen from auto-hiding so our React splash
// screen can show and control when to hide the native splash.
export default function App(): React.ReactElement | null {
	useEffect(() => {
		ExpoSplash.preventAutoHideAsync().catch(() => {
			/* ignore */
		});
	}, []);

	return null;
}