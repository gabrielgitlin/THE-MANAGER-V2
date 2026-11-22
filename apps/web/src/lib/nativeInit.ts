import { isNative, isIOS } from './platform';

export function initNativePlugins() {
  if (!isNative) return;

  (async () => {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Light });
      if (!isIOS) {
        await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
      }
    } catch { /* native only */ }

    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide({ fadeOutDuration: 300 });
    } catch { /* native only */ }
  })();
}
