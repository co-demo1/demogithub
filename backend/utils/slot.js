// Parses the scheduledAt of a request body.
// undefined -> leave unchanged, null/"" -> clear the slot,
// otherwise an ISO date starting a one-hour slot. The client books whole
// local hours, so in UTC the minutes are a multiple of 15 (zone offsets).
const parseSlot = (input) => {
  if (input === undefined) return { value: undefined };
  if (input === null || input === "") return { value: null };
  if (typeof input !== "string") return { error: "Invalid scheduledAt" };

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return { error: "Invalid scheduledAt" };
  if (date.getUTCMinutes() % 15 || date.getUTCSeconds() || date.getUTCMilliseconds()) {
    return { error: "scheduledAt must start on the hour" };
  }
  return { value: date };
};

module.exports = { parseSlot };
