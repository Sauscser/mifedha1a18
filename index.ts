import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import './src/amplifyConfig';
import App from './App';

// Must be registered outside React component scope.
messaging().setBackgroundMessageHandler(async remoteMessage => {
	console.log('Background message:', remoteMessage);
});

registerRootComponent(App);
