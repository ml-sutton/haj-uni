import {
  GetNotificationMessage,
  getNotificationHeader,
} from "@/const/notificationMessages";
import type { Dose } from "@/models/dose";
import { areNotificationsEnabled } from "@/service/privacyService";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DOSE_CHANNEL_ID = "dose-reminders";
const DOSE_SILENT_CHANNEL_ID = "dose-reminders-silent";

/** Ensure notification permissions and Android channel are set up. */
export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(DOSE_CHANNEL_ID, {
      name: "Dose reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync(DOSE_SILENT_CHANNEL_ID, {
      name: "Dose reminders (silent)",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0],
      sound: null,
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
  /** When true, deliver reminders silently (no notification sound). */
  isSilent?: boolean;
  /** Force scheduling even when notificationsEnabled setting is false. */
  force?: boolean;
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
  if (!options?.force && !areNotificationsEnabled()) return;
  const hasPermission = await ensureNotificationSetup();
  if (!hasPermission) return;

  const isDiscrete = options?.isDiscrete ?? false;
  const isSilent = options?.isSilent ?? false;
  const title = getNotificationHeader(isDiscrete);
  const body = GetNotificationMessage(isDiscrete);
  const channelId = isSilent ? DOSE_SILENT_CHANNEL_ID : DOSE_CHANNEL_ID;
  const content: Notifications.NotificationContentInput = {
    title,
    body,
    ...(isSilent ? { sound: false } : {}),
  };

  const triggerBase = {
    type: Notifications.SchedulableTriggerInputTypes.DATE as const,
    ...(Platform.OS === "android" && { channelId }),
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
        content,
        trigger: {
          ...triggerBase,
          date: reminder5MinBefore,
        },
      });
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `${dose.id}-ontime`,
      content,
      trigger: {
        ...triggerBase,
        date: scheduledDate,
      },
    });
  }
}

/** Cancel all scheduled dose reminders created by this service. */
export async function cancelDoseReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .map((n) => n.identifier)
    .filter((id) => id.endsWith("-5min") || id.endsWith("-ontime"));
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}
