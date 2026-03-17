import {
  GetNotificationMessage,
  getNotificationHeader,
} from "@/const/notificationMessages";
import type { Dose } from "@/models/dose";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DOSE_CHANNEL_ID = "dose-reminders";

/** Ensure notification permissions and Android channel are set up. */
export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(DOSE_CHANNEL_ID, {
      name: "Dose reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export interface ScheduleDoseRemindersOptions {
  /** When true, uses discrete notification copy (e.g. generic "shark fact" style). */
  isDiscrete?: boolean;
}

/**
 * Schedule two local notifications per dose:
 * - One 5 minutes before the scheduled dose time
 * - One at the scheduled dose time
 * Title and body come from notificationMessages (respects isDiscrete).
 */
export async function scheduleDoseReminders(
  doses: Dose[],
  options?: ScheduleDoseRemindersOptions
): Promise<void> {
  const hasPermission = await ensureNotificationSetup();
  if (!hasPermission) return;

  const isDiscrete = options?.isDiscrete ?? false;
  const title = getNotificationHeader(isDiscrete);
  const body = GetNotificationMessage(isDiscrete);

  const triggerBase = {
    type: Notifications.SchedulableTriggerInputTypes.DATE as const,
    ...(Platform.OS === "android" && { channelId: DOSE_CHANNEL_ID }),
  };

  const now = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;

  for (const dose of doses) {
    const scheduledDate =
      dose.scheduledTime instanceof Date
        ? dose.scheduledTime
        : new Date(dose.scheduledTime);
    const scheduledTime = scheduledDate.getTime();

    if (scheduledTime <= now) continue;

    const reminder5MinBefore = new Date(scheduledTime - fiveMinutesMs);

    if (reminder5MinBefore.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${dose.id}-5min`,
        content: { title, body },
        trigger: {
          ...triggerBase,
          date: reminder5MinBefore,
        },
      });
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `${dose.id}-ontime`,
      content: { title, body },
      trigger: {
        ...triggerBase,
        date: scheduledDate,
      },
    });
  }
}
