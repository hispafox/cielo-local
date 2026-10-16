import assert from "node:assert/strict";
import test from "node:test";

import { RECENT_CITIES_STORAGE_KEY } from "../src/recent-cities.js";

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.hidden = false;
    this.textContent = "";
    this.value = "";
    this.className = "";
    this.classList = {
      add: (...names) => {
        this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(" ");
      },
      remove: (...names) => {
        this.className = this.className
          .split(/\s+/)
          .filter((name) => name && !names.includes(name))
          .join(" ");
      },
    };
  }

  addEventListener(type, listener, options = {}) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push({ listener, once: options.once === true });
    this.listeners.set(type, listeners);
  }

  dispatch(type, event = {}) {
    const listeners = this.listeners.get(type) ?? [];
    for (const entry of [...listeners]) {
      entry.listener(event);
      if (entry.once) {
        this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item !== entry));
      }
    }
  }

  append(...elements) {
    for (const element of elements) {
      element.parentElement = this;
      this.children.push(element);
    }
  }

  replaceChildren(...elements) {
    this.children = [];
    this.append(...elements);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  querySelector(selector) {
    const isMatch = (element) => selector.startsWith(".")
      ? element.className.split(/\s+/).includes(selector.slice(1))
      : selector.startsWith("#") && element.id === selector.slice(1);

    for (const child of this.children) {
      if (isMatch(child)) {
        return child;
      }
      const nested = child.querySelector(selector);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const isMatch = (element) => selector.startsWith(".")
      ? element.className.split(/\s+/).includes(selector.slice(1))
      : selector === element.tagName.toLocaleLowerCase();
    const visit = (element) => {
      for (const child of element.children) {
        if (isMatch(child)) {
          matches.push(child);
        }
        visit(child);
      }
    };
    visit(this);
    return matches;
  }

  click() {
    this.dispatch("click", { target: this });
  }

  focus() {}
}

class FakeForm extends FakeElement {
  constructor() {
    super("form");
    this.requestSubmitCalls = 0;
  }

  requestSubmit() {
    this.requestSubmitCalls += 1;
    this.dispatch("submit", { preventDefault() {} });
  }
}

function createDocument() {
  const elements = new Map();
  return {
    querySelector(selector) {
      const id = selector.slice(1);
      if (!elements.has(id)) {
        const element = id === "search-form" ? new FakeForm() : new FakeElement();
        element.id = id;
        elements.set(id, element);
      }
      return elements.get(id);
    },
    querySelectorAll() {
      return [];
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    createElementNS(_namespace, tagName) {
      return new FakeElement(tagName);
    },
  };
}

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

function weatherResponse() {
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 9, 16 + index));
    return date.toISOString().slice(0, 10);
  });
  return {
    timezone: "Europe/Madrid",
    current: {
      time: "2026-10-16T10:00",
      temperature_2m: 16,
      relative_humidity_2m: 48,
      apparent_temperature: 17,
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
      time: ["2026-10-16T10:00", "2026-10-16T11:00"],
      temperature_2m: [16, 18],
    },
    hourly_units: {
      time: "iso8601",
      temperature_2m: "°C",
    },
  };
}

function createWeatherFetch(requests) {
  return async (input) => {
    const url = new URL(input);
    requests.push(url);
    if (url.hostname === "geocoding-api.open-meteo.com") {
      return new Response(JSON.stringify({
        results: [{
          name: "Madrid",
          admin1: "Comunidad de Madrid",
          country: "España",
          country_code: "ES",
          latitude: 40.4168,
          longitude: -3.7038,
        }],
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.hostname === "api.open-meteo.com") {
      return new Response(JSON.stringify(weatherResponse()), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`Destino de red inesperado: ${url.origin}`);
  };
}

function setGlobal(name, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: previous?.enumerable ?? false,
    writable: true,
    value,
  });
  return () => {
    if (previous) {
      Object.defineProperty(globalThis, name, previous);
    } else {
      delete globalThis[name];
    }
  };
}

async function loadApplication(document, importName, registerRestore) {
  registerRestore("document", document);
  registerRestore("window", {
    setInterval() {
      return 1;
    },
    setTimeout() {
      return 1;
    },
  });
  await import(`../src/app.js?${importName}`);
}

async function waitFor(predicate) {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail("La interfaz no alcanzó el estado esperado.");
}

async function mountApplication(storage, importName) {
  const previousGlobals = [];
  const registerRestore = (name, value) => previousGlobals.push(setGlobal(name, value));
  const requests = [];
  registerRestore("localStorage", storage);
  registerRestore("fetch", createWeatherFetch(requests));
  const document = createDocument();
  await loadApplication(document, importName, registerRestore);
  return {
    document,
    requests,
    restore() {
      for (const restoreGlobal of previousGlobals.reverse()) {
        restoreGlobal();
      }
    },
  };
}

async function searchMadrid(document) {
  document.querySelector("#city-input").value = "Madrid";
  document.querySelector("#search-form").requestSubmit();
  await waitFor(() => document.querySelector("#weather-view").hidden === false);
}

test("integra la búsqueda y el historial local en la interfaz", async () => {
  const previousGlobals = [];
  const restore = (name, value) => previousGlobals.push(setGlobal(name, value));
  const storage = createStorage();
  const requests = [];

  restore("localStorage", storage);
  restore("fetch", createWeatherFetch(requests));

  try {
    const firstDocument = createDocument();
    await loadApplication(firstDocument, "recent-cities-initial", restore);

    const recentSection = firstDocument.querySelector("#recent-cities");
    const recentList = firstDocument.querySelector("#recent-cities-list");
    const form = firstDocument.querySelector("#search-form");
    assert.equal(recentSection.hidden, true);
    assert.equal(recentList.children.length, 0);

    firstDocument.querySelector("#city-input").value = "Madrid";
    form.requestSubmit();
    await waitFor(() => firstDocument.querySelector("#weather-view").hidden === false);

    assert.equal(recentSection.hidden, false);
    assert.equal(recentList.children.length, 1);
    const savedButton = recentList.querySelector(".recent-city");
    assert.equal(savedButton.textContent, "Madrid, España");
    assert.equal(savedButton.type, "button");
    assert.equal(savedButton.attributes.get("aria-label"), "Volver a consultar Madrid, España");
    assert.deepEqual(JSON.parse(storage.getItem(RECENT_CITIES_STORAGE_KEY)), [{
      label: "Madrid, España",
      query: "Madrid, Comunidad de Madrid, España",
    }]);

    const reloadedDocument = createDocument();
    await loadApplication(reloadedDocument, "recent-cities-reload", restore);
    const reloadedSection = reloadedDocument.querySelector("#recent-cities");
    const reloadedList = reloadedDocument.querySelector("#recent-cities-list");
    assert.equal(reloadedSection.hidden, false);
    assert.equal(reloadedList.children.length, 1);

    reloadedList.querySelector(".recent-city").click();
    await waitFor(() => reloadedDocument.querySelector("#weather-view").hidden === false);

    assert.equal(reloadedDocument.querySelector("#search-form").requestSubmitCalls, 1);
    assert.equal(reloadedDocument.querySelector("#city-input").value, "Madrid, Comunidad de Madrid, España");
    assert.equal(reloadedList.children.length, 1);
    assert.deepEqual(
      requests.map((url) => url.hostname),
      [
        "geocoding-api.open-meteo.com",
        "api.open-meteo.com",
        "geocoding-api.open-meteo.com",
        "api.open-meteo.com",
      ],
    );
  } finally {
    for (const restoreGlobal of previousGlobals.reverse()) {
      restoreGlobal();
    }
  }
});

test("avisa de un fallo de lectura y permite continuar con la búsqueda meteorológica", async () => {
  let savedValue = null;
  const storage = {
    getItem() {
      throw new Error("lectura bloqueada");
    },
    setItem(_key, value) {
      savedValue = String(value);
    },
  };
  const app = await mountApplication(storage, "recent-cities-read-failure");

  try {
    const status = app.document.querySelector("#app-status");
    const recentSection = app.document.querySelector("#recent-cities");
    assert.match(status.textContent, /No se pudo leer el historial local/);
    assert.equal(status.attributes.get("role"), "alert");
    assert.equal(recentSection.hidden, true);

    await searchMadrid(app.document);
    assert.equal(app.document.querySelector("#weather-view").hidden, false);
    assert.equal(recentSection.hidden, false);
    assert.equal(JSON.parse(savedValue)[0].label, "Madrid, España");
    assert.deepEqual(app.requests.map((url) => url.hostname), [
      "geocoding-api.open-meteo.com",
      "api.open-meteo.com",
    ]);
  } finally {
    app.restore();
  }
});

test("avisa de JSON malformado sin mostrarlo y mantiene operativo el flujo de búsqueda", async () => {
  const storage = createStorage(JSON.stringify({
    label: "<img src=x onerror=alert(1)>",
    query: "Madrid",
  }));
  const app = await mountApplication(storage, "recent-cities-invalid-data");

  try {
    const status = app.document.querySelector("#app-status");
    const recentSection = app.document.querySelector("#recent-cities");
    const recentList = app.document.querySelector("#recent-cities-list");
    assert.match(status.textContent, /dañado o no tiene un formato válido/);
    assert.equal(status.attributes.get("role"), "alert");
    assert.equal(recentSection.hidden, true);
    assert.equal(recentList.children.length, 0);

    await searchMadrid(app.document);
    assert.equal(app.document.querySelector("#weather-view").hidden, false);
    assert.equal(recentSection.hidden, false);
    assert.equal(recentList.querySelector(".recent-city").textContent, "Madrid, España");
    assert.equal(JSON.parse(storage.getItem(RECENT_CITIES_STORAGE_KEY))[0].label, "Madrid, España");
  } finally {
    app.restore();
  }
});

test("un fallo de escritura se anuncia sin afirmar persistencia ni interrumpir la previsión", async () => {
  const storage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("escritura bloqueada");
    },
  };
  const app = await mountApplication(storage, "recent-cities-write-failure");

  try {
    await searchMadrid(app.document);

    const status = app.document.querySelector("#app-status");
    assert.equal(app.document.querySelector("#weather-view").hidden, false);
    assert.match(status.textContent, /Previsión actualizada para Madrid, España/);
    assert.match(status.textContent, /No se pudo guardar la ciudad en el historial local/);
    assert.equal(status.attributes.get("role"), "alert");
    assert.equal(app.document.querySelector("#recent-cities").hidden, true);
    assert.equal(app.document.querySelector("#recent-cities-list").children.length, 0);
    assert.deepEqual(app.requests.map((url) => url.hostname), [
      "geocoding-api.open-meteo.com",
      "api.open-meteo.com",
    ]);
  } finally {
    app.restore();
  }
});

test("muestra como texto un nombre almacenado con marcado HTML", async () => {
  const hostileLabel = "<img src=x onerror=alert(1)>";
  const storage = createStorage(JSON.stringify([{
    label: hostileLabel,
    query: "Madrid",
  }]));
  const app = await mountApplication(storage, "recent-cities-text-only");

  try {
    const button = app.document.querySelector("#recent-cities-list").querySelector(".recent-city");
    assert.equal(button.textContent, hostileLabel);
    assert.equal(button.children.length, 0);
  } finally {
    app.restore();
  }
});
