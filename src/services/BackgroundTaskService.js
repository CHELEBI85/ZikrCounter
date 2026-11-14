// Kept as a thin shim.
//
// This used to register a task via Notifications.registerTaskAsync, which only
// fires for *incoming remote* notifications — the app sends none, so the task
// never ran and the prayer schedule it was supposed to refresh silently
// expired. It also posted a "tracking prayer times..." notification one second
// after every launch, which told the user nothing.
//
// Prayer notifications are now repeating daily alarms (see
// PrayerNotificationService), refreshed on each launch, so no background work
// is needed. Only the cleanup entry point is still used.

import { cancelScheduledByPrefixes } from '../utils/notificationHelpers';

class BackgroundTaskService {
  /** Remove any leftovers from the old background-notification scheme. */
  static async cleanupLegacyNotifications() {
    try {
      await cancelScheduledByPrefixes(['background-start']);
    } catch (error) {
      console.log('Legacy background notification cleanup failed:', error?.message);
    }
  }
}

export default BackgroundTaskService;
