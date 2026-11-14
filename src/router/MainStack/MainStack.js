import React, { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../../pages/HomeScreen/HomeScreen";
import FavoriteScreen from "../../pages/FavoriteScreen/FavoriteScreen";
import PrayerTimes from "../../pages/PrayerTimes/PrayerTimes";
import CitySelection from "../../pages/CitySelection/CitySelection";
import PrivacyPolicy from "../../pages/PrivacyPolicy/PrivacyPolicy";
import TermsOfService from "../../pages/TermsOfService/TermsOfService";
import QuranSurahListScreen from "../../pages/Quran/QuranSurahListScreen";
import QuranReaderScreen from "../../pages/Quran/QuranReaderScreen";
import HadithListScreen from "../../pages/Hadith/HadithListScreen";
import HadithDetailScreen from "../../pages/Hadith/HadithDetailScreen";
import SavedVersesScreen from "../../pages/Saved/SavedVersesScreen";
import SavedHadithsScreen from "../../pages/Saved/SavedHadithsScreen";
import SourcesScreen from "../../pages/Sources/SourcesScreen";
import { CHANNELS } from "../../utils/notificationChannels";
import QiblaScreen from "../../pages/Qibla/QiblaScreen";
import { fixedColors } from "../../utils/Theme/VectorTheme";
import { useSelector, useDispatch } from "react-redux";
import { fetchPrayerTimes } from "../../redux/CounterSlice";
import * as Notifications from "expo-notifications";
import { useTranslation } from "react-i18next";
import LeftArrow from "../../components/LeftArrow/LeftArrow";

const Stack = createStackNavigator();

const MainStack = () => {
  const { value, selectedCity } = useSelector((state) => state.counter);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPrayerData = async () => {
      try {
        if (selectedCity) {
          await dispatch(fetchPrayerTimes(selectedCity.name));
        } else {
          await dispatch(fetchPrayerTimes("Istanbul"));
        }
      } catch (error) {
        console.log("MainStack: Namaz vakitleri yükleme hatası:", error);
      }
    };

    fetchPrayerData();
  }, [selectedCity, dispatch]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" && value !== 0) {
        setTimeout(() => {
          sendBackgroundNotification();
        }, 5000);
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [value, t]);

  const sendBackgroundNotification = async () => {
    if (value === 0) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t("APP_NAME"),
          body: `${t("COUNT")} ${value} - ${t("CLICK_TO_CONTINUE")}`,
          data: { screen: "Home", type: "background" },
          categoryIdentifier: "background-reminder",
        },
        trigger: { type: "timeInterval", seconds: 2, channelId: CHANNELS.background },
        identifier: "background-notification",
      });
    } catch (error) {
      console.log("Arka plan bildirimi gönderilemedi:", error);
    }
  };

  return (
    <Stack.Navigator>
      <Stack.Screen options={{ headerShown: false }} name="Home" component={HomeScreen} />

      <Stack.Screen options={{ headerShown: false }} name="QuranSurahList" component={QuranSurahListScreen} />
      <Stack.Screen options={{ headerShown: false }} name="QuranReader" component={QuranReaderScreen} />
      <Stack.Screen options={{ headerShown: false }} name="HadithList" component={HadithListScreen} />
      <Stack.Screen options={{ headerShown: false }} name="HadithDetail" component={HadithDetailScreen} />
      <Stack.Screen options={{ headerShown: false }} name="SavedVerses" component={SavedVersesScreen} />
      <Stack.Screen options={{ headerShown: false }} name="SavedHadiths" component={SavedHadithsScreen} />
      <Stack.Screen options={{ headerShown: false }} name="Sources" component={SourcesScreen} />
      <Stack.Screen options={{ headerShown: false }} name="Qibla" component={QiblaScreen} />
      <Stack.Screen
        options={{
          title: t("TITLE"),
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: fixedColors.header,
            height: 80,
          },
          headerTitleStyle: {
            color: "#fff",
            fontWeight: "700",
            fontSize: 24,
            fontFamily: "OpenSans",
          },
          headerLeft: () => <LeftArrow />,
        }}
        name="FavoriteScreen"
        component={FavoriteScreen}
      />
      <Stack.Screen
        options={{
          title: t("PRAYER_TIMES"),
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: fixedColors.header,
            height: 80,
          },
          headerTitleStyle: {
            color: "#ffff",
            fontWeight: "700",
            fontSize: 24,
            fontFamily: "OpenSans",
          },
          headerLeft: () => <LeftArrow />,
        }}
        name="PrayerTimes"
        component={PrayerTimes}
      />
      <Stack.Screen options={{ headerShown: false }} name="PrivacyPolicy" component={PrivacyPolicy} />
      <Stack.Screen options={{ headerShown: false }} name="CitySelection" component={CitySelection} />
      <Stack.Screen options={{ headerShown: false }} name="TermsOfService" component={TermsOfService} />
    </Stack.Navigator>
  );
};

export default MainStack;
