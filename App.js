import { store } from "./src/redux/store";
import react, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import Navigation from "./src/router/Navigation/Navigation";
import { Provider } from "react-redux";
import { useAppFonts } from "./src/utils/Fonts/Fonts";
import * as SplashScreen from "expo-splash-screen";
import { hydrateAppLanguage } from "./src/i18n/i18n";
import { PaperProvider } from "react-native-paper";
import mobileAds from 'react-native-google-mobile-ads';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const fontsLoaded = useAppFonts();
  const [languageReady, setLanguageReady] = useState(false);

  // Apply the saved app language before the first paint, otherwise the UI
  // flashes in the device language and then swaps.
  useEffect(() => {
    hydrateAppLanguage().finally(() => setLanguageReady(true));
  }, []);

  useEffect(() => {
    // Google Mobile Ads'ı initialize et
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
      })
      .catch(error => {
        console.log('❌ Google Mobile Ads initialization error:', error);
      });
  }, []);

  if (!fontsLoaded || !languageReady) {
    return null;
  }
  return (
    <Provider store={store}>
      <PaperProvider>
      <StatusBar style="auto" backgroundColor="transparent" translucent={true} />
        <Navigation />
      </PaperProvider>
    </Provider>
  );
}
