const OFFSET_TIME_ZONE_PATTERN = /^(?:Z|[+-]\d{2}(?::?\d{2})?|(?:UTC|GMT)[+-]\d{1,2}(?::?\d{2})?)$/i;

export function isValidIanaTimeZone(timeZone) {
  if (
    typeof timeZone !== "string"
    || timeZone.length === 0
    || timeZone !== timeZone.trim()
    || OFFSET_TIME_ZONE_PATTERN.test(timeZone)
  ) {
    return false;
  }

  try {
    return Boolean(new Intl.DateTimeFormat("en", { timeZone }).resolvedOptions().timeZone);
  } catch {
    return false;
  }
}

export function getClockReading(instant, timeZone) {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    throw new TypeError("La hora del reloj debe basarse en una fecha válida.");
  }

  if (timeZone !== undefined && !isValidIanaTimeZone(timeZone)) {
    throw new RangeError("La zona horaria debe ser un identificador IANA válido.");
  }

  const zoneOption = timeZone === undefined ? {} : { timeZone };
  const parts = new Intl.DateTimeFormat("en-GB", {
    ...zoneOption,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const numericParts = Object.fromEntries(
    parts
      .filter(({ type }) => type === "hour" || type === "minute" || type === "second")
      .map(({ type, value }) => [type, Number(value)]),
  );
  const { hour, minute, second } = numericParts;
  const formattedTime = new Intl.DateTimeFormat("es-ES", {
    ...zoneOption,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(instant);

  return {
    formattedTime,
    hour,
    minute,
    second,
    hourAngle: ((hour % 12) + minute / 60 + second / 3600) * 30,
    minuteAngle: (minute + second / 60) * 6,
    secondAngle: second * 6,
    instant: instant.toISOString(),
  };
}
