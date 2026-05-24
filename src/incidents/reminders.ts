import { Platform } from 'react-native';

const EIGHT_WEEKS_MS = 8 * 7 * 24 * 60 * 60 * 1000;

export interface ReminderInput {
  incidentId: string;
  title: string;
  body: string;
  delayMs?: number;
}

export async function scheduleEightWeekReminder(input: ReminderInput): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const Notifications = await import('expo-notifications');
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== 'granted') return null;
  }
  return Notifications.scheduleNotificationAsync({
    content: { title: input.title, body: input.body, data: { incidentId: input.incidentId } },
    trigger: {
      type: 'timeInterval' as never,
      seconds: Math.floor((input.delayMs ?? EIGHT_WEEKS_MS) / 1000),
    } as never,
  });
}

export async function cancelReminder(reminderId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');
  await Notifications.cancelScheduledNotificationAsync(reminderId);
}
