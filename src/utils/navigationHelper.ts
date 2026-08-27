import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../../navigation/navigationRef';
import { HomeStackScreenNames } from '../../navigation/HomeTabNav';

type Params = Record<string, any> | undefined;

export function navigateToHomeNested(screenName: string, params?: Params) {
  const targetParams = { screen: 'Home', params: { screen: screenName, params } };

  const dispatchToHomes = () => {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'Homes',
        params: targetParams,
      })
    );
  };

  if (!navigationRef.isReady()) {
    // Defer navigation until the ref is ready
    setTimeout(() => {
      try {
        dispatchToHomes();
      } catch (e) {
        // swallow
      }
    }, 300);
    return;
  }

  try {
    dispatchToHomes();
  } catch (e) {
    // final noop: if Homes isn't mounted yet, there's no valid global path
  }
}

export function safeNavigateFrom(navigation: any, screenName: string, params?: Params) {
  const isHomeStackScreen = HomeStackScreenNames.includes(screenName);

  if (navigation && typeof navigation.navigate === 'function') {
    try {
      const currentRoutes = navigation.getState?.()?.routes;
      const homeRoute = Array.isArray(currentRoutes) && currentRoutes.find((route: any) => route.name === 'Home');
      const homeMounted = !!homeRoute && !!homeRoute.state && Array.isArray(homeRoute.state.routes);

      if (homeMounted && isHomeStackScreen) {
        try {
          navigation.navigate('Home', { screen: screenName, params });
          return;
        } catch (e) {
          // fall through to global navigation below
        }
      }
    } catch (e) {
      // fall through to navigationRef
    }
  }

  navigateToHomeNested(screenName, params);
}

export default navigateToHomeNested;
