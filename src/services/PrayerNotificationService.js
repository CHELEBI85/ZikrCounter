import * as Notifications from 'expo-notifications';
import moment from 'moment';
import 'moment-timezone';
import i18n from '../i18n/i18n';
import { cancelScheduledByPrefixes } from '../utils/notificationHelpers';
import { CHANNELS } from '../utils/notificationChannels';

const PRAYER_PREFIXES = ['prayer_reminder_', 'prayer_time_'];
const REMINDER_MINUTES = 10;
const SOURCE_TZ = 'Europe/Istanbul';

const PRAYERS = [
  { key: 'Fajr', label: 'FAJR' },
  { key: 'Dhuhr', label: 'DHUHR' },
  { key: 'Asr', label: 'ASR' },
  { key: 'Maghrib', label: 'MAGHRIB' },
  { key: 'Isha', label: 'ISHA' },
];

class PrayerNotificationService {
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Schedule the day's prayer notifications as *repeating daily* alarms.
   *
   * They used to be one-off `date` triggers for today and tomorrow, refreshed
   * by a background task that never actually ran (see BackgroundTaskService),
   * so prayer notifications went silent about two days after the last time the
   * app was opened. A daily trigger keeps firing indefinitely, and because this
   * runs on every launch the times stay current — the same accuracy the old
   * code already assumed when it reused today's timings for tomorrow.
   *
   * @param {{timings: Record<string,string>}} prayerTimes Aladhan payload
   * @param {string} cityName
   */
  static async schedulePrayerNotifications(prayerTimes, cityName = 'İstanbul') {
    try {
      // Only clear previous prayer notifications — leave zikr / daily-verse intact.
      await cancelScheduledByPrefixes(PRAYER_PREFIXES);

      if (!prayerTimes?.timings) return;

      const today = moment().tz(SOURCE_TZ).format('YYYY-MM-DD');

      for (const prayer of PRAYERS) {
        const time = prayerTimes.timings[prayer.key];
        if (!time) continue;

        // Timings are published for Istanbul; convert to the device's own zone
        // so a traveller still gets them at the right wall-clock moment.
        const at = moment.tz(`${today} ${time}`, SOURCE_TZ).local();
        const reminderAt = at.clone().subtract(REMINDER_MINUTES, 'minutes');
        const prayerName = i18n.t(prayer.label);

        await this.scheduleDaily({
          id: `prayer_reminder_${prayer.key}`,
          hour: reminderAt.hour(),
          minute: reminderAt.minute(),
          title: i18n.t('NOTIF_PRAYER_SOON_TITLE'),
          body: i18n.t('NOTIF_PRAYER_SOON_BODY', {
            prayer: prayerName,
            minutes: REMINDER_MINUTES,
            city: cityName,
          }),
          data: { type: 'prayer_reminder', prayer: prayer.key, city: cityName },
        });

        await this.scheduleDaily({
          id: `prayer_time_${prayer.key}`,
          hour: at.hour(),
          minute: at.minute(),
          title: i18n.t('NOTIF_PRAYER_NOW_TITLE'),
          body: i18n.t('NOTIF_PRAYER_NOW_BODY', { prayer: prayerName, city: cityName }),
          data: { type: 'prayer_time', prayer: prayer.key, city: cityName },
        });
      }
    } catch (error) {
      console.log('Error scheduling prayer notifications:', error?.message);
    }
  }

  static async scheduleDaily({ id, hour, minute, title, body, data }) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title,
          body,
          data,
          sound: 'default',
          priority: 'high',
          categoryIdentifier: 'prayer-notification',
        },
        trigger: { type: 'daily', hour, minute, channelId: CHANNELS.prayer },
      });
    } catch (error) {
      console.log('Error scheduling notification:', error?.message);
    }
  }

  static async cancelAllNotifications() {
    try {
      await cancelScheduledByPrefixes(PRAYER_PREFIXES);
    } catch (error) {
      console.log('Error cancelling notifications:', error?.message);
    }
  }

  static async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.log('Error getting scheduled notifications:', error?.message);
      return [];
    }
  }
}

export default PrayerNotificationService;
