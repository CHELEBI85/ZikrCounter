import * as Notifications from "expo-notifications";

/**
 * Cancel only scheduled notifications whose identifier starts with one of the
 * given prefixes. Never calls cancelAll — so prayer / zikr / verse schedules
 * can coexist.
 * @param {string[]} prefixes
 */
export const cancelScheduledByPrefixes = async (prefixes) => {
  if (!prefixes?.length) return;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => {
        const id = n.identifier || "";
        return prefixes.some((p) => id === p || id.startsWith(p));
      })
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
  );
};

/** Cancel a fixed list of identifiers (no-op if not scheduled). */
export const cancelScheduledByIds = async (ids) => {
  await Promise.all(
    (ids || []).map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
  );
};
