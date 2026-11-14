import * as Notifications from "expo-notifications";
import i18n from "../i18n/i18n";
import { cancelScheduledByIds } from "../utils/notificationHelpers";
import { CHANNELS } from "../utils/notificationChannels";

const ZIKR_DAILY_TYPES = [
  { hour: 9, minute: 0, type: "morning" },
  { hour: 12, minute: 30, type: "lunch" },
  { hour: 18, minute: 0, type: "evening" },
  { hour: 22, minute: 0, type: "night" },
  { hour: 3, minute: 0, type: "late" },
];

const zikrDailyId = (type, hour) => `zikr-daily-${type}-${hour}`;

/**
 * Schedule daily zikr reminder notifications.
 * Cancels only its own (and legacy) identifiers — never cancelAll.
 */
export const scheduleDailyZikrNotifications = async () => {
  try {
    const legacyIds = ZIKR_DAILY_TYPES.map(({ type, hour }) => `daily-${type}-${hour}`);
    const newIds = ZIKR_DAILY_TYPES.map(({ type, hour }) => zikrDailyId(type, hour));
    await cancelScheduledByIds([...legacyIds, ...newIds]);

    const NOTIFICATIONS = i18n.t("NOTIFICATIONS-MESSAGE");
    const fixedMessage = Array.isArray(NOTIFICATIONS) ? NOTIFICATIONS[0] : "";
    const getRandomMessage = () => {
      if (!Array.isArray(NOTIFICATIONS) || NOTIFICATIONS.length < 2) return fixedMessage;
      const messages = NOTIFICATIONS.filter((_, index) => index !== 0);
      return messages[Math.floor(Math.random() * messages.length)];
    };

    const slots = [
      { ...ZIKR_DAILY_TYPES[0], message: getRandomMessage() },
      { ...ZIKR_DAILY_TYPES[1], message: getRandomMessage() },
      { ...ZIKR_DAILY_TYPES[2], message: getRandomMessage() },
      { ...ZIKR_DAILY_TYPES[3], message: getRandomMessage() },
      { ...ZIKR_DAILY_TYPES[4], message: fixedMessage },
    ];

    for (const { hour, minute, message, type } of slots) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t("APP_NAME"),
          body: message,
          data: {
            screen: "Home",
            type: "daily",
            notificationType: type,
          },
          categoryIdentifier: "daily-reminder",
          sound: "default",
        },
        trigger: { type: "daily", hour, minute, channelId: CHANNELS.zikr },
        identifier: zikrDailyId(type, hour),
      });
    }
  } catch (error) {
    console.log("Zikr daily notification scheduling failed:", error?.message);
  }
};
