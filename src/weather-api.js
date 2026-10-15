import { isValidIanaTimeZone } from "./time-utils.js";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 12_000;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function fetchJson(url, serviceName, signal) {
  const requestController = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => requestController.abort(signal.reason);
  const timeoutId = setTimeout(() => {
    timedOut = true;
    requestController.abort();
  }, REQUEST_TIMEOUT_MS);

  if (signal?.aborted) {
    abortFromCaller();
  } else {
    signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: requestController.signal,
    });

    if (!response.ok) {
      throw new Error(`${serviceName} respondió con el estado HTTP ${response.status}.`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(`${serviceName} devolvió una respuesta JSON no válida.`, { cause: error });
    }
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    if (timedOut) {
      throw new Error(`${serviceName} tardó demasiado en responder. Vuelve a intentarlo.`, { cause: error });
    }

    if (error instanceof TypeError) {
      throw new Error(`No se pudo conectar con ${serviceName}. Comprueba tu conexión.`, { cause: error });
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

function parseLocation(candidate) {
  if (
    !isRecord(candidate)
    || typeof candidate.name !== "string"
    || !candidate.name.trim()
    || !Number.isFinite(candidate.latitude)
    || !Number.isFinite(candidate.longitude)
  ) {
    return null;
  }

  return {
    name: candidate.name.trim(),
    admin1: typeof candidate.admin1 === "string" ? candidate.admin1.trim() : "",
    country: typeof candidate.country === "string" ? candidate.country.trim() : "",
    countryCode: typeof candidate.country_code === "string" ? candidate.country_code : "",
    latitude: candidate.latitude,
    longitude: candidate.longitude,
  };
}

export async function searchLocations(cityName, signal) {
  if (typeof cityName !== "string" || cityName.trim().length < 2) {
    throw new TypeError("Escribe al menos dos caracteres para buscar una ciudad.");
  }

  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name: cityName.trim(),
    count: "5",
    language: "es",
    format: "json",
  }).toString();

  const payload = await fetchJson(url, "el servicio de búsqueda de ciudades", signal);
  if (!isRecord(payload)) {
    throw new Error("El servicio de búsqueda devolvió una respuesta inesperada.");
  }

  if (payload.results === undefined) {
    return [];
  }

  if (!Array.isArray(payload.results)) {
    throw new Error("El servicio de búsqueda devolvió resultados con un formato inesperado.");
  }

  const locations = payload.results.map(parseLocation).filter((location) => location !== null);
  if (payload.results.length > 0 && locations.length === 0) {
    throw new Error("No se pudieron interpretar las ubicaciones devueltas por el servicio.");
  }

  return locations;
}

function requireNumber(record, key, description, { min = -Infinity, max = Infinity } = {}) {
  const value = record[key];
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`La respuesta meteorológica no contiene un valor válido para ${description}.`);
  }

  return value;
}

function requireUnit(units, key, description) {
  if (typeof units[key] !== "string" || !units[key].trim()) {
    throw new Error(`La respuesta meteorológica no incluye la unidad de ${description}.`);
  }

  return units[key];
}

export async function fetchForecast(location, signal) {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    hourly: "temperature_2m",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timezone: "auto",
    forecast_days: "7",
  }).toString();

  const payload = await fetchJson(url, "el servicio meteorológico", signal);
  if (!isRecord(payload) || !isRecord(payload.current) || !isRecord(payload.current_units)) {
    throw new Error("El servicio meteorológico devolvió datos actuales con un formato inesperado.");
  }

  if (!isRecord(payload.daily) || !isRecord(payload.daily_units) || !Array.isArray(payload.daily.time)) {
    throw new Error("El servicio meteorológico devolvió la previsión diaria con un formato inesperado.");
  }

  if (!isRecord(payload.hourly) || !isRecord(payload.hourly_units)) {
    throw new Error("El servicio meteorológico devolvió la previsión horaria con un formato inesperado.");
  }

  const current = payload.current;
  const currentUnits = payload.current_units;
  const daily = payload.daily;
  const dailyUnits = payload.daily_units;
  const hourly = payload.hourly;
  const hourlyUnits = payload.hourly_units;

  if (
    typeof current.time !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(current.time)
    || (current.is_day !== 0 && current.is_day !== 1)
    || !Number.isInteger(current.weather_code)
  ) {
    throw new Error("El servicio meteorológico devolvió condiciones actuales incompletas.");
  }

  if (daily.time.length === 0 || daily.time.length > 7) {
    throw new Error("El servicio meteorológico no devolvió una previsión válida de siete días.");
  }

  const dailyArrays = [
    daily.weather_code,
    daily.temperature_2m_max,
    daily.temperature_2m_min,
  ];
  if (dailyArrays.some((values) => !Array.isArray(values) || values.length !== daily.time.length)) {
    throw new Error("El servicio meteorológico devolvió días con datos incompletos.");
  }

  const precipitationProbabilities = daily.precipitation_probability_max;
  if (
    precipitationProbabilities !== undefined
    && (!Array.isArray(precipitationProbabilities) || precipitationProbabilities.length !== daily.time.length)
  ) {
    throw new Error("El servicio meteorológico devolvió probabilidades de precipitación no válidas.");
  }

  const forecastDays = daily.time.map((date, index) => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("El servicio meteorológico devolvió una fecha no válida.");
    }

    const code = daily.weather_code[index];
    if (!Number.isInteger(code)) {
      throw new Error("El servicio meteorológico devolvió un código de tiempo no válido.");
    }

    const probability = precipitationProbabilities?.[index];
    return {
      date,
      weatherCode: code,
      highC: requireNumber({ value: daily.temperature_2m_max[index] }, "value", "temperatura máxima"),
      lowC: requireNumber({ value: daily.temperature_2m_min[index] }, "value", "temperatura mínima"),
      precipitationProbability: probability === null || probability === undefined
        ? null
        : requireNumber({ value: probability }, "value", "probabilidad de precipitación", { min: 0, max: 100 }),
    };
  });

  if (
    !Array.isArray(hourly.time)
    || !Array.isArray(hourly.temperature_2m)
    || hourly.time.length === 0
    || hourly.temperature_2m.length !== hourly.time.length
  ) {
    throw new Error("El servicio meteorológico devolvió horas con datos incompletos.");
  }

  const forecastHours = hourly.time.map((time, index) => {
    if (typeof time !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time)) {
      throw new Error("El servicio meteorológico devolvió una hora no válida.");
    }

    return {
      time,
      temperatureC: requireNumber(
        { value: hourly.temperature_2m[index] },
        "value",
        "temperatura horaria",
      ),
    };
  });

  return {
    timeZone: isValidIanaTimeZone(payload.timezone) ? payload.timezone : null,
    current: {
      time: current.time,
      temperatureC: requireNumber(current, "temperature_2m", "temperatura actual"),
      feelsLikeC: requireNumber(current, "apparent_temperature", "sensación térmica"),
      humidity: requireNumber(current, "relative_humidity_2m", "humedad", { min: 0, max: 100 }),
      precipitation: requireNumber(current, "precipitation", "precipitación", { min: 0 }),
      windSpeed: requireNumber(current, "wind_speed_10m", "velocidad del viento", { min: 0 }),
      weatherCode: current.weather_code,
      isDay: current.is_day === 1,
    },
    currentUnits: {
      humidity: requireUnit(currentUnits, "relative_humidity_2m", "humedad"),
      precipitation: requireUnit(currentUnits, "precipitation", "precipitación"),
      windSpeed: requireUnit(currentUnits, "wind_speed_10m", "velocidad del viento"),
    },
    dailyUnits: {
      precipitationProbability: typeof dailyUnits.precipitation_probability_max === "string"
        ? dailyUnits.precipitation_probability_max
        : "%",
    },
    hourlyUnits: {
      temperature: requireUnit(hourlyUnits, "temperature_2m", "temperatura horaria"),
    },
    days: forecastDays,
    hours: forecastHours,
  };
}
