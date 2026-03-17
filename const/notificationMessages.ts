const notificationMessages: readonly string[] = [
  "I get messages from the shark, dodo dodo do, To take my HRT",
  "The sharks have taken their HRT, have you?",
  "Don't disappoint the sharks, do it!",
]

function GetDiscreteNotificationMessage(): string {
  const randomNumber = Math.floor(Math.random() * 177013) + 1;
  return `Your daily cool shark fact has dropped! log in to see cool shark fact ${randomNumber}`;
}


function GetNotificationMessage(isDiscrete: boolean): string {
  if (isDiscrete) {
    return GetDiscreteNotificationMessage();
  }
  const randomIndex = Math.floor(Math.random() * notificationMessages.length);
  return notificationMessages[randomIndex];
}
const getNotificationHeader = (isDiscrete: boolean): string => {
  if (isDiscrete) {
    return "Haj, shark facts";
  }
  return "Haj app";
}

export { GetNotificationMessage, getNotificationHeader };