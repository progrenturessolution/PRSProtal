export const NOTIFICATION_TYPE_GROUPS = {
  GENERAL: ['General/Announcement', 'Certificate'],
  INTERVIEW: ['Interview'],
  ASSESSMENT: ['Test/Assessment'],
  GD: ['GD'],
};

export function getUserStorageKey(baseKey, user) {
  const uid = user?._id || user?.id || 'anon';
  return `${baseKey}-${uid}`;
}

export function getLatestTimestamp(items = [], extraFields = []) {
  const fields = ['createdAt', 'updatedAt', 'dateTime', 'date', ...extraFields];
  return items.reduce((latest, item) => {
    const times = fields.map((field) => {
      const value = item?.[field];
      return value ? new Date(value).getTime() : 0;
    });
    const maxTime = Math.max(...times, 0);
    return maxTime > latest ? maxTime : latest;
  }, 0);
}

export function hasUnseenByTimestamp(items, storageKey) {
  const lastSeen = Number(localStorage.getItem(storageKey) || 0);
  const latest = getLatestTimestamp(items);
  return latest > lastSeen;
}

export function markSeenByTimestamp(items, storageKey) {
  const latest = getLatestTimestamp(items);
  localStorage.setItem(storageKey, String(latest || Date.now()));
}

export function hasUnreadByType(notifications = [], types = []) {
  const typeSet = new Set(types);
  return notifications.some(
    (notification) => typeSet.has(notification.notificationType) && !notification.isRead
  );
}

export function markNotificationsReadLocally(notifications = [], types = []) {
  const typeSet = new Set(types);
  return notifications.map((notification) =>
    typeSet.has(notification.notificationType)
      ? { ...notification, isRead: true }
      : notification
  );
}

export function countUnreadByType(notifications = [], types = []) {
  const typeSet = new Set(types);
  return notifications.filter(
    (notification) => typeSet.has(notification.notificationType) && !notification.isRead
  ).length;
}
