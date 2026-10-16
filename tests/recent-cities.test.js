import assert from "node:assert/strict";
import test from "node:test";

import {
  addRecentCity,
  readRecentCities,
  RecentCitiesDataError,
  RecentCitiesStorageError,
  RECENT_CITIES_STORAGE_KEY,
} from "../src/recent-cities.js";

function createStorage(initialValue = null) {
  const values = new Map();
  if (initialValue !== null) {
    values.set(RECENT_CITIES_STORAGE_KEY, initialValue);
  }

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

test("lee una lista vacía y recupera entradas válidas", () => {
  assert.deepEqual(readRecentCities(createStorage()), []);

  const storage = createStorage(JSON.stringify([
    { label: "Madrid, España", query: "Madrid, Comunidad de Madrid, España" },
    { label: "Lisboa, Portugal", query: "Lisboa, Portugal" },
  ]));
  assert.deepEqual(readRecentCities(storage), [
    { label: "Madrid, España", query: "Madrid, Comunidad de Madrid, España" },
    { label: "Lisboa, Portugal", query: "Lisboa, Portugal" },
  ]);
});

test("guarda ciudades y las recupera desde el almacenamiento en una nueva lectura", () => {
  const storage = createStorage();
  const saved = addRecentCity([], {
    label: "Madrid, España",
    query: "Madrid, Comunidad de Madrid, España",
  }, storage);

  assert.deepEqual(saved, [
    { label: "Madrid, España", query: "Madrid, Comunidad de Madrid, España" },
  ]);
  assert.deepEqual(readRecentCities(storage), saved);
});

test("rechaza JSON dañado y estructuras inválidas para evitar tratar el historial como vacío", () => {
  assert.throws(
    () => readRecentCities(createStorage("{no es json")),
    RecentCitiesDataError,
  );
  assert.throws(
    () => readRecentCities(createStorage(JSON.stringify({ city: "Madrid" }))),
    RecentCitiesDataError,
  );
  assert.throws(
    () => readRecentCities(createStorage(JSON.stringify([
      { label: "Madrid", query: "Madrid" },
      { label: "", query: "Lisboa" },
    ]))),
    RecentCitiesDataError,
  );
});

test("deduplica ciudades normalizadas y coloca la consulta más reciente primero", () => {
  const storage = createStorage();
  const cities = [
    { label: "Lisboa, Portugal", query: "Lisboa, Portugal" },
    { label: "Madrid, España", query: "Madrid, Comunidad de Madrid, España" },
  ];

  const updated = addRecentCity(cities, {
    label: "MÁLAGA, España",
    query: " Málaga,   Andalucía, España ",
  }, storage);
  const reordered = addRecentCity(updated, {
    label: "Málaga, España",
    query: "málaga, Andalucía, ESPAÑA",
  }, storage);

  assert.deepEqual(reordered, [
    { label: "Málaga, España", query: "málaga, Andalucía, ESPAÑA" },
    ...cities,
  ]);
  assert.deepEqual(readRecentCities(storage), reordered);
});

test("comunica los fallos de lectura y escritura del almacenamiento", () => {
  const failingReadStorage = {
    getItem() {
      throw new Error("lectura bloqueada");
    },
  };
  assert.throws(
    () => readRecentCities(failingReadStorage),
    (error) => error instanceof RecentCitiesStorageError && error.operation === "read",
  );

  const failingWriteStorage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("escritura bloqueada");
    },
  };
  assert.throws(
    () => addRecentCity([], {
      label: "Madrid, España",
      query: "Madrid, España",
    }, failingWriteStorage),
    (error) => error instanceof RecentCitiesStorageError && error.operation === "write",
  );
});

test("comunica que el acceso al objeto localStorage también puede estar bloqueado", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("acceso bloqueado");
    },
  });

  try {
    assert.throws(
      () => readRecentCities(),
      (error) => error instanceof RecentCitiesStorageError && error.operation === "read",
    );
    assert.throws(
      () => addRecentCity([], { label: "Madrid", query: "Madrid" }),
      (error) => error instanceof RecentCitiesStorageError && error.operation === "write",
    );
  } finally {
    if (previous) {
      Object.defineProperty(globalThis, "localStorage", previous);
    } else {
      delete globalThis.localStorage;
    }
  }
});
