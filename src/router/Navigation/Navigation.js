import React, { useEffect } from "react";
import { Platform } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Notifications from "expo-notifications";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStorage,
  fetchActiveZikr,
  fetchFavorites,
  fetchCurrentIndex,
  fetchFontSize,
  fetchPrayerTimes,
  setNotificationPermission,
  setSelectedCity,
} from "../../redux/CounterSlice";
import { hydrateSavedContent } from "../../redux/SavedContentSlice";
import { hydrateContentPrefs } from "../../redux/ContentPrefsSlice";
import PrayerNotificationService from "../../services/PrayerNotificationService";
import BackgroundTaskService from "../../services/BackgroundTaskService";
import { setupNotificationChannels } from "../../utils/notificationChannels";
import { scheduleDailyVerseNotifications } from "../../services/DailyVerseNotificationService";
import { scheduleDailyZikrNotifications } from "../../services/ZikrNotificationService";
import * as Location from 'expo-location';
import { useTranslation } from "react-i18next";
import { findNearestCity } from "../../data/cities";
import BottomTabs from "../BottomTabs/BottomTabs";
import MainStack from "../MainStack/MainStack";

const RootStack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();

// Open the exact ayah when a "Verse of the Day" notification is tapped.
const handleNotificationResponse = (response) => {
  const data = response?.notification?.request?.content?.data;
  if (data?.type === "daily_verse" && data.surahNumber) {
    const go = () =>
      navigationRef.navigate("MainStack", {
        screen: "QuranReader",
        params: { surahNumber: data.surahNumber, focusAyah: data.ayahNumber },
      });
    if (navigationRef.isReady()) go();
    else setTimeout(go, 800);
  }
};


const Navigation = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const contentLanguage = useSelector((s) => s.contentPrefs.contentLanguage);

  // Channel names show up in Android's own notification settings, so refresh
  // them whenever the UI language changes.
  useEffect(() => {
    setupNotificationChannels(t);
  }, [t, i18n.language]);

  useEffect(() => {
    const initializeApp = async () => { 
      try {
        // Redux state'lerini yükle
        dispatch(fetchStorage());
        dispatch(fetchActiveZikr());
        dispatch(fetchFavorites());
        dispatch(fetchCurrentIndex());
        dispatch(fetchFontSize());
        dispatch(hydrateSavedContent());
        dispatch(hydrateContentPrefs());
        
        // Bildirim izni iste
        const hasPermission = await PrayerNotificationService.requestPermissions();
        dispatch(setNotificationPermission(hasPermission));

        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        
        // Konum izni iste ve şehir tespit et
        let selectedCity = { id: 34, name: 'İstanbul', code: 'istanbul' }; // Varsayılan
        
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status === 'granted') {
            
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = location.coords;
            

            
            // En yakın şehri bul
            const nearestCity = findNearestCity(latitude, longitude);
            
            if (nearestCity) {
              selectedCity = nearestCity;
            } else {
            }
          } else {
          }
        } catch (locationError) {
        }
        
        // Tespit edilen şehri Redux'a kaydet
        dispatch(setSelectedCity(selectedCity));
        
        // İlk yüklemede namaz vakitlerini getir
        const prayerTimesResult = await dispatch(fetchPrayerTimes(selectedCity.name));
        
            // Bildirimleri planla
            if (hasPermission && prayerTimesResult.payload) {
              await PrayerNotificationService.schedulePrayerNotifications(
                prayerTimesResult.payload,
                selectedCity.name
              );
              
              await BackgroundTaskService.cleanupLegacyNotifications();
            }

        // Zikr + verse schedules coexist with prayer (prefix-scoped cancel)
        if (hasPermission) {
          await scheduleDailyZikrNotifications();
        }
      } catch (error) {
        console.log('❌ Uygulama başlatma hatası:', error);
      }
    };

    initializeApp();
  }, [dispatch]);

  // Daily verse notifications — reschedule when content language changes
  useEffect(() => {
    scheduleDailyVerseNotifications(contentLanguage);
  }, [contentLanguage]);

  // Deep-link: handle daily-verse notification taps (cold start + warm).
  useEffect(() => {
    let mounted = true;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (mounted && response) handleNotificationResponse(response);
    });
    const sub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="BottomTabs" component={BottomTabs} />
        <RootStack.Screen name="MainStack" component={MainStack} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
