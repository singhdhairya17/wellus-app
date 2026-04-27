import Constants from 'expo-constants';

/** Running inside the Expo Go client (not a dev or production build). */
export const isExpoGo = Constants.appOwnership === 'expo';

let notificationsModulePromise = null;
let handlerInstalled = false;

/**
 * Lazy-load expo-notifications. In Expo Go (SDK 53+), importing the module runs
 * side effects that throw on Android. Outside Expo Go, returns the module namespace.
 */
export function loadExpoNotifications() {
  if (isExpoGo) {
    return Promise.resolve(null);
  }
  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications').catch(() => null);
  }
  return notificationsModulePromise;
}

/**
 * Install the default foreground handler once (dev / standalone builds only).
 */
export async function ensureNotificationHandler() {
  if (isExpoGo || handlerInstalled) return;
  const Notifications = await loadExpoNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  handlerInstalled = true;
}

export async function requestPermissionsAsyncSafe() {
  const Notifications = await loadExpoNotifications();
  if (!Notifications) {
    return { status: 'denied' };
  }
  await ensureNotificationHandler();
  return Notifications.requestPermissionsAsync();
}
