// Push & Background Notification Helper for DPS Buzz
// Enables system notifications even when the browser tab is minimized or in background

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('DPS Buzz 🐝', {
        body: 'Background notifications are now active! You will get alerts for chats, calls, and school notices.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url: '/notifications' },
      });
    }
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function showBackgroundNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    url?: string;
    vibrate?: number[];
  }
): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  // Hardware vibration on mobile devices
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(options.vibrate || [200, 100, 200]);
    } catch {}
  }

  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const payload = {
    body: options.body,
    icon: options.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: options.tag || 'dpsbuzz-alert',
    vibrate: options.vibrate || [200, 100, 200],
    data: { url: options.url || '/home' },
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 800)),
      ]);
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, payload);
        return true;
      }
    }
    new Notification(title, payload);
    return true;
  } catch (err) {
    try {
      new Notification(title, payload);
      return true;
    } catch {
      console.warn('Failed to show notification:', err);
      return false;
    }
  }
}
