const conditions = new Map([
  [0, { description: "Despejado", icon: "sun", theme: "clear" }],
  [1, { description: "Mayormente despejado", icon: "partly-cloudy", theme: "partly-cloudy" }],
  [2, { description: "Parcialmente nublado", icon: "partly-cloudy", theme: "cloudy" }],
  [3, { description: "Nublado", icon: "cloud", theme: "cloudy" }],
  [45, { description: "Niebla", icon: "fog", theme: "fog" }],
  [48, { description: "Niebla engelante", icon: "fog", theme: "fog" }],
  [51, { description: "Llovizna ligera", icon: "drizzle", theme: "drizzle" }],
  [53, { description: "Llovizna moderada", icon: "drizzle", theme: "drizzle" }],
  [55, { description: "Llovizna intensa", icon: "drizzle", theme: "drizzle" }],
  [56, { description: "Llovizna engelante ligera", icon: "drizzle", theme: "drizzle" }],
  [57, { description: "Llovizna engelante intensa", icon: "drizzle", theme: "drizzle" }],
  [61, { description: "Lluvia ligera", icon: "rain", theme: "rain" }],
  [63, { description: "Lluvia moderada", icon: "rain", theme: "rain" }],
  [65, { description: "Lluvia intensa", icon: "rain", theme: "rain" }],
  [66, { description: "Lluvia engelante ligera", icon: "rain", theme: "rain" }],
  [67, { description: "Lluvia engelante intensa", icon: "rain", theme: "rain" }],
  [71, { description: "Nevada ligera", icon: "snow", theme: "snow" }],
  [73, { description: "Nevada moderada", icon: "snow", theme: "snow" }],
  [75, { description: "Nevada intensa", icon: "snow", theme: "snow" }],
  [77, { description: "Granos de nieve", icon: "snow", theme: "snow" }],
  [80, { description: "Chubascos ligeros", icon: "rain", theme: "rain" }],
  [81, { description: "Chubascos moderados", icon: "rain", theme: "rain" }],
  [82, { description: "Chubascos intensos", icon: "rain", theme: "rain" }],
  [85, { description: "Chubascos de nieve ligeros", icon: "snow", theme: "snow" }],
  [86, { description: "Chubascos de nieve intensos", icon: "snow", theme: "snow" }],
  [95, { description: "Tormenta", icon: "storm", theme: "storm" }],
  [96, { description: "Tormenta con granizo ligero", icon: "storm", theme: "storm" }],
  [99, { description: "Tormenta con granizo intenso", icon: "storm", theme: "storm" }],
]);

const unknownCondition = Object.freeze({
  description: "Condición meteorológica no reconocida",
  icon: "cloud",
  theme: "cloudy",
});

export function getWeatherInfo(code) {
  if (!Number.isInteger(code)) {
    return unknownCondition;
  }

  return conditions.get(code) ?? unknownCondition;
}
