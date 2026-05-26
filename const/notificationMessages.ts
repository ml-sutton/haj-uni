/** Playful default reminder bodies shown when discrete mode is off. */
const notificationMessages: readonly string[] = [
  "I get messages from the shark, dodo dodo do, To take my HRT",
  "The sharks have taken their HRT, have you?",
  "Don't disappoint the sharks, do it!",
];

/**
 * Returns a neutral notification body for discrete mode (no medication-specific wording).
 *
 * @returns A generic “shark fact” style message with a random number.
 *
 * @remarks
 * Copy is intentionally unrelated to HRT so lock-screen previews stay discreet.
 */
function GetDiscreteNotificationMessage(): string {
  const randomNumber = Math.floor(Math.random() * 177013) + 1;
  return `Your daily cool shark fact has dropped! log in to see cool shark fact ${randomNumber}`;
}

/**
 * Picks a random notification body based on discrete mode.
 *
 * @param isDiscrete - When `true`, uses {@link GetDiscreteNotificationMessage}; otherwise a random entry from {@link notificationMessages}.
 * @returns Notification body text for the dose reminder.
 */
function GetNotificationMessage(isDiscrete: boolean): string {
  if (isDiscrete) {
    return GetDiscreteNotificationMessage();
  }
  const randomIndex = Math.floor(Math.random() * notificationMessages.length);
  return notificationMessages[randomIndex];
}

/**
 * Returns the notification title shown in the system tray.
 *
 * @param isDiscrete - When `true`, uses neutral “shark facts” branding.
 * @returns Short header string for the notification.
 */
const getNotificationHeader = (isDiscrete: boolean): string => {
  if (isDiscrete) {
    return "Haj, shark facts";
  }
  return "Haj app";
};

export { GetNotificationMessage, getNotificationHeader };
