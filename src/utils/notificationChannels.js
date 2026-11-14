// Android notification channels.
//
// Channels were being created but never referenced: every notification was
// scheduled without a channelId, so Android filed them all under the default
// channel and the configured importance / vibration never applied. Every
// scheduler now passes one of these ids on its trigger.

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const CHANNELS = {
  prayer: "prayer-reminders",
  zikr: "daily-reminders",
  verse: "verse-reminders",
  background: "background-reminders",
};

/**
 * Create/update every channel. Safe to call repeatedly; call it again when the
 * UI language changes so the names Android shows in system settings follow.
 * @param {(key: string) => string} t
 */
export const setupNotificationChannels = async (t) => {
  if (Platform.OS !== "android") return;

  const { AndroidImportance } = Notifications;

  await Promise.all([
    Notifications.setNotificationChannelAsync(CHANNELS.prayer, {
      name: t("NOTIF_CHANNEL_PRAYER"),
      description: t("NOTIF_CHANNEL_PRAYER_DESC"),
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1E9E76",
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.zikr, {
      name: t("NOTIF_CHANNEL_DAILY"),
      description: t("NOTIF_CHANNEL_DAILY_DESC"),
      importance: AndroidImportance.DEFAULT,
      sound: "default",
      vibrationPattern: [0, 200, 150, 200],
      lightColor: "#1E9E76",
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.verse, {
      name: t("NOTIF_CHANNEL_VERSE"),
      description: t("NOTIF_CHANNEL_VERSE_DESC"),
      importance: AndroidImportance.DEFAULT,
      sound: "default",
      lightColor: "#1E9E76",
    }),
    Notifications.setNotificationChannelAsync(CHANNELS.background, {
      name: t("NOTIF_CHANNEL_BACKGROUND"),
      description: t("NOTIF_CHANNEL_BACKGROUND_DESC"),
      importance: AndroidImportance.LOW,
      sound: null,
    }),
  ]);
};
