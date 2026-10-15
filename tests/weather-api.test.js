import assert from "node:assert/strict";
import test from "node:test";

import { fetchForecast, searchLocations } from "../src/weather-api.js";

async function withMockedFetch(handler, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler;

  try {
    await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("geocodifica con parámetros codificados y valida la ubicación", async () => {
  let requestedUrl;
  const payload = {
    results: [{
      name: "Madrid",
      admin1: "Comunidad de Madrid",
      country: "España",
      country_code: "ES",
      latitude: 40.4168,
      longitude: -3.7038,
    }],
  };

  await withMockedFetch(async (input) => {
    requestedUrl = new URL(input);
    return new Response(JSON.stringify(payload), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  }, async () => {
    const locations = await searchLocations("Madrid, España");
    assert.equal(locations.length, 1);
    assert.equal(locations[0].country, "España");
    assert.equal(locations[0].latitude, 40.4168);
  });

  assert.equal(requestedUrl.origin, "https://geocoding-api.open-meteo.com");
  assert.equal(requestedUrl.searchParams.get("name"), "Madrid, España");
  assert.equal(requestedUrl.searchParams.get("language"), "es");
  assert.equal(requestedUrl.searchParams.get("count"), "5");
});

test("solicita siete días y normaliza la respuesta meteorológica", async () => {
  let requestedUrl;
  let requestCount = 0;
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 9, 14 + index, 12));
    return date.toISOString().slice(0, 10);
  });
  const payload = {
    timezone: "Europe/Madrid",
    current: {
      time: "2026-10-14T10:00",
      temperature_2m: 16,
      relative_humidity_2m: 48,
      apparent_temperature: 19,
      is_day: 1,
      precipitation: 0,
      weather_code: 0,
      wind_speed_10m: 12,
    },
    current_units: {
      temperature_2m: "°C",
      relative_humidity_2m: "%",
      apparent_temperature: "°C",
      is_day: "",
      precipitation: "mm",
      weather_code: "wmo code",
      wind_speed_10m: "km/h",
    },
    daily: {
      time: dates,
      weather_code: [0, 1, 2, 3, 61, 80, 95],
      temperature_2m_max: [20, 21, 22, 19, 17, 18, 16],
      temperature_2m_min: [10, 11, 12, 9, 8, 9, 7],
      precipitation_probability_max: [0, 0, 10, 15, 65, 35, 80],
    },
    daily_units: {
      time: "iso8601",
      weather_code: "wmo code",
      temperature_2m_max: "°C",
      temperature_2m_min: "°C",
      precipitation_probability_max: "%",
    },
    hourly: {
      time: ["2026-10-14T10:00", "2026-10-14T11:00", "2026-10-14T12:00"],
      temperature_2m: [16, 18, 17],
    },
    hourly_units: {
      time: "iso8601",
      temperature_2m: "°C",
    },
  };

  await withMockedFetch(async (input) => {
    requestCount += 1;
    requestedUrl = new URL(input);
    return new Response(JSON.stringify(payload), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  }, async () => {
    const forecast = await fetchForecast({ latitude: 40.4, longitude: -3.7 });
    assert.equal(forecast.current.temperatureC, 16);
    assert.equal(forecast.timeZone, "Europe/Madrid");
    assert.equal(forecast.currentUnits.windSpeed, "km/h");
    assert.equal(forecast.days.length, 7);
    assert.equal(forecast.days[4].precipitationProbability, 65);
    assert.deepEqual(forecast.hours, [
      { time: "2026-10-14T10:00", temperatureC: 16 },
      { time: "2026-10-14T11:00", temperatureC: 18 },
      { time: "2026-10-14T12:00", temperatureC: 17 },
    ]);
    assert.equal(forecast.hourlyUnits.temperature, "°C");
  });

  assert.equal(requestedUrl.origin, "https://api.open-meteo.com");
  assert.equal(requestedUrl.searchParams.get("forecast_days"), "7");
  assert.equal(requestedUrl.searchParams.get("temperature_unit"), "celsius");
  assert.equal(requestedUrl.searchParams.get("hourly"), "temperature_2m");
  assert.equal(requestedUrl.searchParams.get("timezone"), "auto");
  assert.equal(requestCount, 1);
  assert.equal(
    requestedUrl.searchParams.get("daily"),
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );

  for (const timeZone of [undefined, "Mars/Olympus"]) {
    const payloadWithoutValidZone = structuredClone(payload);
    if (timeZone === undefined) {
      delete payloadWithoutValidZone.timezone;
    } else {
      payloadWithoutValidZone.timezone = timeZone;
    }

    await withMockedFetch(async () => new Response(JSON.stringify(payloadWithoutValidZone), {
      headers: { "content-type": "application/json" },
      status: 200,
    }), async () => {
      const forecast = await fetchForecast({ latitude: 40.4, longitude: -3.7 });
      assert.equal(forecast.timeZone, null);
      assert.equal(forecast.current.temperatureC, 16);
    });
  }
});

test("expone los errores HTTP del servicio", async () => {
  await withMockedFetch(async () => new Response("", { status: 503 }), async () => {
    await assert.rejects(
      searchLocations("Madrid"),
      /estado HTTP 503/,
    );
  });
});
