const statuses = new Set(["waiting", "active", "completed", "blocked"]);
const agentIds = ["orchestrator", "planner", "developer", "verifier"];

export const statusLabels = Object.freeze({
  waiting: "Pendiente",
  active: "En curso",
  completed: "Completado",
  blocked: "Bloqueado",
  unknown: "Sin datos",
});

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateTimestamp(value, field) {
  if (value !== null && (typeof value !== "string" || !Number.isFinite(Date.parse(value)))) {
    throw new TypeError(`El campo ${field} debe ser una fecha ISO o null.`);
  }
}

function validateStage(stage, field, allowCycle = false) {
  if (!isRecord(stage)) {
    throw new TypeError(`El campo ${field} debe ser un objeto.`);
  }
  if (!statuses.has(stage.status)) {
    throw new TypeError(`El estado de ${field} debe ser waiting, active, completed o blocked.`);
  }
  if (typeof stage.message !== "string") {
    throw new TypeError(`El campo ${field}.message debe ser texto.`);
  }
  validateTimestamp(stage.updatedAt, `${field}.updatedAt`);

  if (stage.artifact !== undefined && typeof stage.artifact !== "string") {
    throw new TypeError(`El campo ${field}.artifact debe ser texto.`);
  }
  if (allowCycle && stage.cycle !== undefined && (!Number.isInteger(stage.cycle) || stage.cycle < 1 || stage.cycle > 3)) {
    throw new TypeError(`El campo ${field}.cycle debe ser un número del 1 al 3.`);
  }
}

export function validateWorkflowStatus(value) {
  if (!isRecord(value)) {
    throw new TypeError("El archivo de estado debe contener un objeto JSON.");
  }
  if (!Object.hasOwn(value, "issue")) {
    throw new TypeError("Falta el campo issue en el archivo de estado.");
  }
  if (value.issue !== null) {
    if (!isRecord(value.issue)) {
      throw new TypeError("El campo issue debe ser un objeto o null.");
    }
    const { id, title, url } = value.issue;
    if (!((typeof id === "string" && id.trim()) || (typeof id === "number" && Number.isFinite(id) && id > 0))) {
      throw new TypeError("El campo issue.id debe ser un identificador o número positivo.");
    }
    if (typeof title !== "string" || !title.trim()) {
      throw new TypeError("El campo issue.title debe contener el título del issue.");
    }
    if (url !== undefined) {
      if (typeof url !== "string") {
        throw new TypeError("El campo issue.url debe ser una URL HTTP o HTTPS.");
      }
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        throw new TypeError("El campo issue.url debe ser una URL HTTP o HTTPS.");
      }
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        throw new TypeError("El campo issue.url debe ser una URL HTTP o HTTPS.");
      }
    }
  }

  validateTimestamp(value.updatedAt, "updatedAt");
  if (!isRecord(value.agents)) {
    throw new TypeError("El campo agents debe contener el estado de cada agente.");
  }
  for (const agentId of agentIds) {
    validateStage(value.agents[agentId], `agents.${agentId}`, agentId === "developer");
  }
  validateStage(value.release, "release");

  return value;
}

export async function fetchWorkflowStatus(fetchImpl = fetch) {
  const response = await fetchImpl(new URL("../workflow-status.json", import.meta.url), {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`No se pudo leer workflow-status.json (HTTP ${response.status}).`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("workflow-status.json no contiene JSON válido.");
  }
  return validateWorkflowStatus(data);
}

export function formatWorkflowTimestamp(timestamp) {
  if (!timestamp) {
    return "sin actividad registrada";
  }
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
