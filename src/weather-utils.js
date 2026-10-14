export function convertTemperature(celsius, unit) {
  if (!Number.isFinite(celsius)) {
    throw new TypeError("La temperatura debe ser un número finito.");
  }

  if (unit === "celsius") {
    return celsius;
  }

  if (unit === "fahrenheit") {
    return (celsius * 9) / 5 + 32;
  }

  throw new RangeError(`Unidad de temperatura no admitida: ${unit}`);
}

export function formatTemperature(celsius, unit) {
  return `${Math.round(convertTemperature(celsius, unit))}°`;
}

export function formatDayLabel(dateString, index) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) {
    throw new RangeError(`Fecha meteorológica no válida: ${dateString}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new RangeError(`Fecha meteorológica no válida: ${dateString}`);
  }

  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError("El índice del día debe ser un entero no negativo.");
  }

  if (index === 0) {
    return "Hoy";
  }

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    weekday: "short",
  }).format(date).replace(/\.$/, "");
}
