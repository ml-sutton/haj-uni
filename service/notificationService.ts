import type { Dose } from "@/models/dose";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DOSE_CHANNEL_ID = "dose-reminders";
const REMINDER_TITLE = "Cool shark fact";
const REMINDER_BODY = "Cool shark fact";

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

/**
 * Schedule two local notifications per dose:
 * - One 5 minutes before the scheduled dose time
 * - One at the scheduled dose time
 * Both use the content "cool shark fact".
 */
export async function scheduleDoseReminders(doses: Dose[]): Promise<void> {
  const hasPermission = await ensureNotificationSetup();
  if (!hasPermission) return;

  const now = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;

  for (const dose of doses) {
    const scheduledDate =
      dose.scheduledTime instanceof Date
        ? dose.scheduledTime
        : new Date(dose.scheduledTime);
    const scheduledTime = scheduledDate.getTime();

    // Only schedule if in the future
    if (scheduledTime <= now) continue;

    const reminder5MinBefore = new Date(scheduledTime - fiveMinutesMs);

    // 5 minutes before
    if (reminder5MinBefore.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${dose.id}-5min`,
        content: {
          title: REMINDER_TITLE,
          body: REMINDER_BODY,
          channelId: Platform.OS === "android" ? DOSE_CHANNEL_ID : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder5MinBefore,
        },
      });
    }

    // On scheduled time
    await Notifications.scheduleNotificationAsync({
      identifier: `${dose.id}-ontime`,
      content: {
        title: REMINDER_TITLE,
        body: REMINDER_BODY,
        channelId: Platform.OS === "android" ? DOSE_CHANNEL_ID : undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
      },
    });
  }
}
