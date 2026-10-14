import assert from "node:assert/strict";
import test from "node:test";

import { getWeatherInfo } from "../src/weather-codes.js";

test("traduce códigos WMO conocidos a una descripción e icono", () => {
  assert.deepEqual(getWeatherInfo(0), {
    description: "Despejado",
    icon: "sun",
    theme: "clear",
  });
  assert.equal(getWeatherInfo(61).description, "Lluvia ligera");
  assert.equal(getWeatherInfo(95).icon, "storm");
});

test("identifica explícitamente códigos meteorológicos desconocidos", () => {
  assert.equal(getWeatherInfo(123).description, "Condición meteorológica no reconocida");
  assert.equal(getWeatherInfo(Number.NaN).theme, "cloudy");
});
