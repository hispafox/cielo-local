export const RECENT_CITIES_STORAGE_KEY = "cielo-local.recent-cities";

export class RecentCitiesStorageError extends Error {
  constructor(operation, cause) {
    const message = operation === "read"
      ? "No se pudo leer el historial del almacenamiento local."
      : "No se pudo guardar el historial en el almacenamiento local.";
    super(message, { cause });
    this.name = "RecentCitiesStorageError";
    this.operation = operation;
  }
}

export class RecentCitiesDataError extends Error {
  constructor(cause) {
    super("El historial guardado tiene un formato no válido.", { cause });
    this.name = "RecentCitiesDataError";
  }
}

function getStorage(storage, operation) {
  try {
    const resolved = storage === undefined ? globalThis.localStorage : storage;
    if (!resolved) {
      throw new Error("El almacenamiento local no está disponible.");
    }
    return resolved;
  } catch (cause) {
    throw new RecentCitiesStorageError(operation, cause);
  }
}

function normalizeEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const label = typeof value.label === "string" ? value.label.trim() : "";
  const query = typeof value.query === "string" ? value.query.trim() : "";
  if (!label || label.length > 200 || !query || query.length > 500) {
    return null;
  }

  return { label, query };
}

function getCityKey(query) {
  return query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueEntries(entries) {
  if (!Array.isArray(entries)) {
    throw new RecentCitiesDataError();
  }

  const seen = new Set();
  const result = [];
  for (const value of entries) {
    const entry = normalizeEntry(value);
    if (!entry) {
      throw new RecentCitiesDataError();
    }

    const key = getCityKey(entry.query);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(entry);
    }
  }
  return result;
}

export function readRecentCities(storage) {
  const target = getStorage(storage, "read");
  let serialized;
  try {
    if (typeof target.getItem !== "function") {
      throw new TypeError("El almacenamiento no permite leer valores.");
    }
    serialized = target.getItem(RECENT_CITIES_STORAGE_KEY);
  } catch (cause) {
    throw new RecentCitiesStorageError("read", cause);
  }

  if (serialized === null || serialized === undefined) {
    return [];
  }

  if (typeof serialized !== "string") {
    throw new RecentCitiesDataError();
  }

  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (cause) {
    throw new RecentCitiesDataError(cause);
  }
  return uniqueEntries(parsed);
}

export function addRecentCity(cities, city, storage) {
  const entry = normalizeEntry(city);
  if (!entry) {
    throw new TypeError("La ciudad debe incluir una etiqueta y una consulta válidas.");
  }
  const next = uniqueEntries([entry, ...uniqueEntries(cities)]);

  const target = getStorage(storage, "write");
  try {
    if (typeof target.setItem !== "function") {
      throw new TypeError("El almacenamiento no permite guardar valores.");
    }
    target.setItem(RECENT_CITIES_STORAGE_KEY, JSON.stringify(next));
  } catch (cause) {
    throw new RecentCitiesStorageError("write", cause);
  }

  return next;
}
