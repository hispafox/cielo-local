import assert from "node:assert/strict";
import test from "node:test";

import { getClockReading, isValidIanaTimeZone } from "../src/time-utils.js";

test("formatea el mismo instante en zonas IANA diferentes", () => {
  const instant = new Date("2026-01-15T12:34:56.000Z");
  const madrid = getClockReading(instant, "Europe/Madrid");
  const newYork = getClockReading(instant, "America/New_York");
  const utc = getClockReading(instant, "UTC");

  assert.equal(madrid.formattedTime, "13:34:56");
  assert.equal(newYork.formattedTime, "07:34:56");
  assert.equal(utc.formattedTime, "12:34:56");
  assert.equal(madrid.instant, instant.toISOString());
});

test("usa la zona horaria local del entorno si no se indica una zona", () => {
  const instant = new Date("2026-06-01T09:08:07.000Z");
  const local = getClockReading(instant);
  const expected = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(instant);

  assert.equal(local.formattedTime, expected);
});

test("representa segundos y posiciones precisas de las manecillas", () => {
  const before = getClockReading(new Date("2026-04-12T10:15:58.000Z"), "UTC");
  const after = getClockReading(new Date("2026-04-12T10:15:59.000Z"), "UTC");

  assert.equal(before.formattedTime, "10:15:58");
  assert.equal(after.formattedTime, "10:15:59");
  assert.equal(before.secondAngle, 348);
  assert.equal(after.secondAngle, 354);
  assert.ok(after.minuteAngle > before.minuteAngle);
  assert.ok(after.hourAngle > before.hourAngle);
});

test("aplica el cambio estacional de primavera y el retroceso de otoño", () => {
  const beforeSpringChange = getClockReading(new Date("2026-03-29T00:59:59.000Z"), "Europe/Madrid");
  const afterSpringChange = getClockReading(new Date("2026-03-29T01:00:00.000Z"), "Europe/Madrid");
  const beforeAutumnChange = getClockReading(new Date("2026-10-25T00:59:59.000Z"), "Europe/Madrid");
  const afterAutumnChange = getClockReading(new Date("2026-10-25T01:00:00.000Z"), "Europe/Madrid");

  assert.equal(beforeSpringChange.formattedTime, "01:59:59");
  assert.equal(afterSpringChange.formattedTime, "03:00:00");
  assert.equal(afterSpringChange.hourAngle, 90);
  assert.equal(beforeAutumnChange.formattedTime, "02:59:59");
  assert.equal(afterAutumnChange.formattedTime, "02:00:00");
});

test("valida identificadores de zona sin sustituirlos por offsets", () => {
  assert.equal(isValidIanaTimeZone("Europe/Madrid"), true);
  assert.equal(isValidIanaTimeZone("UTC"), true);
  assert.equal(isValidIanaTimeZone("Mars/Olympus"), false);
  assert.equal(isValidIanaTimeZone("+02:00"), false);
  assert.equal(isValidIanaTimeZone(" Europe/Madrid "), false);
  assert.throws(() => getClockReading(new Date(), "Mars/Olympus"), RangeError);
  assert.throws(() => getClockReading(new Date(Number.NaN), "UTC"), TypeError);
});
