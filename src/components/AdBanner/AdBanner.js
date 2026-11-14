import { StyleSheet, View, Text } from "react-native";
import React, { useState } from "react";
import {
  BannerAd,
  TestIds,
  BannerAdSize,
  AdEventType,
} from "react-native-google-mobile-ads";
import { useTranslation } from "react-i18next";
import { useExploreTheme } from "../../utils/Theme/ExploreTheme";

const AdBanner = () => {
  const { t } = useTranslation();
  const { c, fonts } = useExploreTheme();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  
  // Environment-based reklam ID'si
  const adUnitId = __DEV__ 
    ? TestIds.BANNER 
    : "YOUR_PRODUCTION_BANNER_ID_HERE"; // Production Banner ID - Replace with your AdMob ID

  const handleAdLoaded = () => {
    setAdLoaded(true);
    setAdError(false);
  };

  const handleAdError = (error) => {
    console.log('❌ Banner ad error:', error);
    setAdError(true);
    setAdLoaded(false);
  };

  // The container paints the app background: the native ad view letterboxes a
  // creative that does not match the requested size, and its own backdrop is
  // black, which showed as bars above and below the banner.
  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {!adError ? (
        <BannerAd
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          unitId={adUnitId}
          onAdLoaded={handleAdLoaded}
          onAdFailedToLoad={handleAdError}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: c.muted, fontFamily: fonts.ui }]}>
            {t("AD_LOAD_FAILED")}
          </Text>
        </View>
      )}
    </View>
  );
};

export default AdBanner;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  errorContainer: {
    width: "100%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontFamily: "OpenSans",
  },
});
