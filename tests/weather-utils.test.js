import assert from "node:assert/strict";
import test from "node:test";

import { convertTemperature, formatDayLabel, formatTemperature } from "../src/weather-utils.js";

test("formatea temperaturas en Celsius y convierte a Fahrenheit", () => {
  assert.equal(formatTemperature(20, "celsius"), "20°");
  assert.equal(convertTemperature(0, "fahrenheit"), 32);
  assert.equal(formatTemperature(20, "fahrenheit"), "68°");
  assert.equal(formatTemperature(-1.8, "celsius"), "-2°");
});

test("rechaza temperaturas o unidades inválidas explícitamente", () => {
  assert.throws(() => formatTemperature(Number.NaN, "celsius"), TypeError);
  assert.throws(() => convertTemperature(10, "kelvin"), RangeError);
});

test("formatea los días del pronóstico en español sin desplazamiento de fecha", () => {
  assert.equal(formatDayLabel("2026-10-14", 0), "Hoy");
  assert.equal(formatDayLabel("2026-10-15", 1), "jue");
  assert.throws(() => formatDayLabel("2026-02-30", 1), RangeError);
});
