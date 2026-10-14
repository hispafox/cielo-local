import { fetchForecast, searchLocations } from "./weather-api.js";
import { getWeatherInfo } from "./weather-codes.js";
import { formatDayLabel, formatTemperature } from "./weather-utils.js";

const iconMarkup = {
  sun: `
    <circle cx="32" cy="32" r="11" fill="currentColor" stroke="none"></circle>
    <path d="M32 5v7M32 52v7M5 32h7M52 32h7M12.9 12.9l5 5M46.1 46.1l5 5M51.1 12.9l-5 5M17.9 46.1l-5 5" stroke-width="3.5"></path>`,
  moon: `
    <path d="M43 10a23 23 0 1 0 11 43A24 24 0 0 1 43 10Z" fill="currentColor" stroke="none"></path>
    <circle cx="17" cy="18" r="1.6" fill="currentColor" stroke="none"></circle>
    <circle cx="13" cy="35" r="1.1" fill="currentColor" stroke="none"></circle>`,
  "partly-cloudy": `
    <circle cx="43" cy="19" r="9" fill="#f1ad37" stroke="none"></circle>
    <path d="M17 47h29a10 10 0 0 0 0-20 13 13 0 0 0-25-2 11 11 0 0 0-4 22Z" fill="rgba(255,255,255,.92)" stroke-width="2.5"></path>`,
  "moon-cloud": `
    <path d="M43 9a20 20 0 1 0 11 37A22 22 0 0 1 43 9Z" fill="#f1e8c3" stroke="none"></path>
    <path d="M17 49h29a10 10 0 0 0 0-20 13 13 0 0 0-25-2 11 11 0 0 0-4 22Z" fill="rgba(255,255,255,.92)" stroke-width="2.5"></path>`,
  cloud: `
    <path d="M16 47h31a11 11 0 0 0 0-22h-1a15 15 0 0 0-28-1 12 12 0 0 0-2 23Z" fill="rgba(255,255,255,.88)" stroke-width="2.5"></path>`,
  fog: `
    <path d="M17 34h29a9 9 0 0 0 0-18 13 13 0 0 0-24-1 10 10 0 0 0-5 19Z" fill="rgba(255,255,255,.7)" stroke-width="2.5"></path>
    <path d="M11 43h42M17 51h31" stroke-width="3"></path>`,
  drizzle: `
    <path d="M17 37h30a10 10 0 0 0 0-20h-1a14 14 0 0 0-27-1 11 11 0 0 0-2 21Z" fill="rgba(255,255,255,.88)" stroke-width="2.5"></path>
    <path d="m25 44-2 5m14-5-2 5m14-5-2 5" stroke="#5b93b7" stroke-width="3.5"></path>`,
  rain: `
    <path d="M16 36h31a10 10 0 0 0 0-20h-1a14 14 0 0 0-27-1 11 11 0 0 0-3 21Z" fill="rgba(255,255,255,.9)" stroke-width="2.5"></path>
    <path d="m23 43-3 8m14-8-3 8m14-8-3 8" stroke="#4b91bb" stroke-width="3.5"></path>`,
  snow: `
    <path d="M16 36h31a10 10 0 0 0 0-20h-1a14 14 0 0 0-27-1 11 11 0 0 0-3 21Z" fill="rgba(255,255,255,.9)" stroke-width="2.5"></path>
    <path d="M23 46h.1M35 49h.1M47 44h.1" stroke="#5794bb" stroke-width="6" stroke-linecap="round"></path>`,
  storm: `
    <path d="M16 36h31a10 10 0 0 0 0-20h-1a14 14 0 0 0-27-1 11 11 0 0 0-3 21Z" fill="rgba(255,255,255,.9)" stroke-width="2.5"></path>
    <path d="m34 38-8 13h7l-2 9 11-15h-7l3-7" fill="#e8ad36" stroke="#d99b28" stroke-width="1.5" stroke-linejoin="round"></path>`,
};

const elements = {
  form: document.querySelector("#search-form"),
  input: document.querySelector("#city-input"),
  button: document.querySelector("#search-button"),
  buttonLabel: document.querySelector("#search-button-label"),
  spinner: document.querySelector("#search-spinner"),
  status: document.querySelector("#app-status"),
  locationPicker: document.querySelector("#location-picker"),
  locationList: document.querySelector("#location-list"),
  welcome: document.querySelector("#welcome-panel"),
  weatherView: document.querySelector("#weather-view"),
  summary: document.querySelector("#weather-summary"),
  card: document.querySelector("#weather-card"),
  locationName: document.querySelector("#location-name"),
  description: document.querySelector("#weather-description"),
  observedTime: document.querySelector("#observed-time"),
  temperature: document.querySelector("#temperature-value"),
  high: document.querySelector("#high-temperature"),
  low: document.querySelector("#low-temperature"),
  feelsLike: document.querySelector("#feels-like"),
  humidity: document.querySelector("#humidity"),
  windSpeed: document.querySelector("#wind-speed"),
  precipitation: document.querySelector("#precipitation"),
  currentIcon: document.querySelector("#current-icon"),
  forecastDays: document.querySelector("#forecast-days"),
  unitButtons: [...document.querySelectorAll("[data-unit]")],
};

const requiredElements = Object.entries(elements).filter(([, element]) => element == null);
if (requiredElements.length > 0) {
  throw new Error(`Faltan elementos requeridos en la interfaz: ${requiredElements.map(([name]) => name).join(", ")}`);
}

let temperatureUnit = "celsius";
let currentWeather = null;
let currentLocation = null;
let activeController = null;
let activeRequestId = 0;

function setStatus(message, kind = "info") {
  elements.status.textContent = message;
  elements.status.hidden = message.length === 0;
  elements.status.className = `app-status app-status--${kind}`;
  elements.status.dataset.kind = kind;
  elements.status.setAttribute("role", kind === "error" ? "alert" : "status");
}

function setBusy(isBusy, label = "Buscando…") {
  elements.button.disabled = isBusy;
  elements.buttonLabel.textContent = isBusy ? label : "Buscar";
  elements.spinner.hidden = !isBusy;

  for (const button of elements.locationList.querySelectorAll("button")) {
    button.disabled = isBusy;
  }
}

function createWeatherIcon(iconName, className) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = iconMarkup[iconName] ?? iconMarkup.cloud;
  return svg;
}

function formatLocationName(location) {
  return [location.name, location.country || location.admin1]
    .filter((part, index, all) => part && all.indexOf(part) === index)
    .join(", ");
}

function formatLocationDetail(location) {
  const parts = [location.admin1, location.country]
    .filter((part, index, all) => part && part !== location.name && all.indexOf(part) === index);
  return parts.length > 0
    ? parts.join(", ")
    : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
}

function clearPreviousResults() {
  elements.locationPicker.hidden = true;
  elements.locationList.replaceChildren();
  elements.weatherView.hidden = true;
  elements.welcome.hidden = true;
  currentWeather = null;
  currentLocation = null;
}

function showLocationChoices(locations, requestId, controller) {
  elements.locationList.replaceChildren();
  for (const location of locations) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = "location-choice";
    button.type = "button";

    const text = document.createElement("span");
    const name = document.createElement("span");
    name.className = "location-choice__name";
    name.textContent = location.name;

    const detail = document.createElement("span");
    detail.className = "location-choice__detail";
    detail.textContent = formatLocationDetail(location);

    text.append(name, detail);
    const arrow = document.createElement("span");
    arrow.className = "location-choice__arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    button.append(text, arrow);
    button.addEventListener("click", () => {
      void loadForecast(location, requestId, controller);
    }, { once: true });
    item.append(button);
    elements.locationList.append(item);
  }

  elements.locationPicker.hidden = false;
}

function displayError(error, task) {
  const rawDetail = error instanceof Error && error.message
    ? error.message
    : "Se produjo un error inesperado. Vuelve a intentarlo.";
  const detail = `${rawDetail.charAt(0).toLocaleUpperCase("es-ES")}${rawDetail.slice(1)}`;
  setStatus(`${task} ${detail}`, "error");
}

function isCurrentRequest(requestId, controller) {
  return requestId === activeRequestId && !controller.signal.aborted;
}

function formatAmount(value, unit) {
  const formatted = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 1,
  }).format(value);

  return unit === "%" ? `${formatted}%` : `${formatted} ${unit}`;
}

function temperatureUnitSuffix() {
  return temperatureUnit === "fahrenheit" ? "F" : "C";
}

function renderTemperatures() {
  if (!currentWeather) {
    return;
  }

  const { current, days } = currentWeather;
  const suffix = temperatureUnitSuffix();
  elements.temperature.textContent = formatTemperature(current.temperatureC, temperatureUnit);
  elements.high.textContent = formatTemperature(days[0].highC, temperatureUnit);
  elements.low.textContent = formatTemperature(days[0].lowC, temperatureUnit);
  elements.feelsLike.textContent = `${formatTemperature(current.feelsLikeC, temperatureUnit)} ${suffix}`;

  elements.summary.textContent = `Ahora mismo, ${formatTemperature(current.temperatureC, temperatureUnit)} ${suffix}, sensación de ${formatTemperature(current.feelsLikeC, temperatureUnit)} ${suffix} y ${getWeatherInfo(current.weatherCode).description.toLocaleLowerCase("es-ES")}.`;

  for (const dayElement of elements.forecastDays.children) {
    const day = days[Number(dayElement.dataset.dayIndex)];
    const temperatures = dayElement.querySelector(".forecast-day__temperatures");
    const high = formatTemperature(day.highC, temperatureUnit);
    const low = formatTemperature(day.lowC, temperatureUnit);
    temperatures.replaceChildren();

    const highValue = document.createElement("strong");
    highValue.textContent = high;
    const separator = document.createElement("span");
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = "/";
    const lowValue = document.createElement("span");
    lowValue.textContent = low;
    temperatures.append(highValue, separator, lowValue);
    temperatures.setAttribute("aria-label", `Máxima ${high} ${suffix}, mínima ${low} ${suffix}`);
  }

  for (const button of elements.unitButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.unit === temperatureUnit));
  }
}

function renderForecastDays(weather) {
  const dayElements = weather.days.map((day, index) => {
    const info = getWeatherInfo(day.weatherCode);
    const item = document.createElement("li");
    item.className = "forecast-day";
    item.dataset.dayIndex = String(index);

    const label = document.createElement("time");
    label.className = "forecast-day__label";
    label.dateTime = day.date;
    label.textContent = formatDayLabel(day.date, index);

    const icon = document.createElement("span");
    icon.className = "forecast-day__icon";
    icon.dataset.icon = info.icon;
    icon.append(createWeatherIcon(info.icon, "weather-icon"));

    const description = document.createElement("span");
    description.className = "forecast-day__description";
    description.textContent = info.description;

    const precipitation = document.createElement("span");
    precipitation.className = "forecast-day__precipitation";
    if (day.precipitationProbability !== null) {
      precipitation.textContent = `Lluvia ${formatAmount(day.precipitationProbability, weather.dailyUnits.precipitationProbability)}`;
    }

    const temperatures = document.createElement("p");
    temperatures.className = "forecast-day__temperatures";

    item.append(label, icon, description, precipitation, temperatures);
    return item;
  });

  elements.forecastDays.replaceChildren(...dayElements);
}

function renderWeather() {
  const { current, currentUnits } = currentWeather;
  const currentInfo = getWeatherInfo(current.weatherCode);

  elements.locationName.textContent = formatLocationName(currentLocation);
  elements.description.textContent = currentInfo.description;
  elements.observedTime.textContent = "Ahora";
  elements.card.dataset.condition = currentInfo.theme;
  elements.card.dataset.time = current.isDay ? "day" : "night";
  const currentIconName = !current.isDay && currentInfo.icon === "sun"
    ? "moon"
    : !current.isDay && currentInfo.icon === "partly-cloudy"
      ? "moon-cloud"
      : currentInfo.icon;
  elements.currentIcon.dataset.icon = currentIconName;
  elements.currentIcon.replaceChildren(createWeatherIcon(currentIconName, "weather-icon"));

  elements.humidity.textContent = formatAmount(current.humidity, currentUnits.humidity);
  elements.windSpeed.textContent = formatAmount(current.windSpeed, currentUnits.windSpeed);
  elements.precipitation.textContent = formatAmount(current.precipitation, currentUnits.precipitation);

  renderForecastDays(currentWeather);
  renderTemperatures();
  elements.weatherView.hidden = false;
  elements.welcome.hidden = true;
}

async function loadForecast(location, requestId, controller) {
  elements.locationPicker.hidden = true;
  setBusy(true, "Cargando…");
  setStatus(`Consultando la previsión de ${formatLocationName(location)}…`, "loading");

  try {
    const weather = await fetchForecast(location, controller.signal);
    if (!isCurrentRequest(requestId, controller)) {
      return;
    }

    currentLocation = location;
    currentWeather = weather;
    renderWeather();
    setStatus(`Previsión actualizada para ${formatLocationName(location)}.`, "success");
    window.setTimeout(() => {
      if (requestId === activeRequestId && elements.status.dataset.kind === "success") {
        setStatus("");
      }
    }, 4_500);
  } catch (error) {
    if (!isCurrentRequest(requestId, controller)) {
      return;
    }
    displayError(error, "No se pudo cargar la previsión.");
  } finally {
    if (requestId === activeRequestId) {
      setBusy(false);
    }
  }
}

async function handleSearch(event) {
  event.preventDefault();

  activeController?.abort();
  const requestId = ++activeRequestId;
  const controller = new AbortController();
  activeController = controller;
  clearPreviousResults();

  const cityName = elements.input.value.trim();
  if (cityName.length < 2) {
    setBusy(false);
    setStatus("Escribe al menos dos caracteres para buscar una ciudad.", "error");
    elements.input.focus();
    return;
  }

  setBusy(true, "Buscando…");
  setStatus(`Buscando «${cityName}»…`, "loading");

  try {
    const locations = await searchLocations(cityName, controller.signal);
    if (!isCurrentRequest(requestId, controller)) {
      return;
    }

    if (locations.length === 0) {
      setStatus(`No encontramos ubicaciones para «${cityName}». Prueba a añadir el país, por ejemplo: «Madrid, España».`, "error");
      return;
    }

    if (locations.length > 1) {
      showLocationChoices(locations, requestId, controller);
      setStatus(`Encontramos ${locations.length} ubicaciones. Elige la correcta para consultar su previsión.`, "info");
      return;
    }

    await loadForecast(locations[0], requestId, controller);
  } catch (error) {
    if (!isCurrentRequest(requestId, controller)) {
      return;
    }
    displayError(error, "No se pudo buscar la ciudad.");
  } finally {
    if (requestId === activeRequestId) {
      setBusy(false);
    }
  }
}

elements.form.addEventListener("submit", (event) => {
  void handleSearch(event);
});

elements.input.addEventListener("input", () => {
  if (elements.status.dataset.kind === "error") {
    setStatus("");
  }
});

for (const button of elements.unitButtons) {
  button.addEventListener("click", () => {
    if (button.dataset.unit !== temperatureUnit) {
      temperatureUnit = button.dataset.unit;
      renderTemperatures();
    }
  });
}
