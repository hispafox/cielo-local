import { fetchWorkflowStatus, formatWorkflowTimestamp, statusLabels } from "./workflow-status.js";
import { advanceDemoWorkflow, createDemoWorkflowStatus, demoSteps } from "./workflow-demo.js";

const descriptions = {
  issue: "Issue recibido por el orquestador. El identificador y el título los publica el flujo activo.",
  orchestrator: "Recibe el issue, coordina a los agentes, lleva el plan entre ellos y aplica el límite de tres ciclos de revisión.",
  planner: "Analiza el issue y crea el documento de planificación que guía la implementación.",
  plan: "Documento generado por el planificador. El orquestador conserva esta ruta y la pasa al desarrollador y al verificador.",
  developer: "Implementa el plan, ejecuta pruebas y atiende los hallazgos del verificador. No hay un agente implementador separado.",
  verifier: "Revisa el plan y la implementación; devuelve una aprobación o los hallazgos que debe resolver el desarrollador.",
  release: "Esta etapa empieza solo después de la aprobación: versionado, commit y preparación del pull request.",
};

const titles = {
  issue: "Issue de entrada",
  orchestrator: "Orquestador",
  planner: "Planificador subagente",
  plan: "Documento de planificación",
  developer: "Desarrollador subagente",
  verifier: "Verificador subagente",
  release: "Versionado, commit y PR",
};

const elements = {
  issueHeading: document.querySelector("#issue-heading"),
  issueDescription: document.querySelector("#issue-description"),
  issueLink: document.querySelector("#issue-link"),
  progressLabel: document.querySelector("#progress-label"),
  progressTrack: document.querySelector("#progress-track"),
  progressFill: document.querySelector("#progress-fill"),
  connection: document.querySelector("#connection-indicator"),
  connectionLabel: document.querySelector("#connection-label"),
  feedMessage: document.querySelector("#feed-message"),
  refreshButton: document.querySelector("#refresh-button"),
  demoBadge: document.querySelector("#demo-badge"),
  demoToggle: document.querySelector("#demo-toggle"),
  demoNext: document.querySelector("#demo-next"),
  detailHeading: document.querySelector("#detail-heading"),
  detailStatus: document.querySelector("#detail-status"),
  detailDescription: document.querySelector("#detail-description"),
  detailMessage: document.querySelector("#detail-message"),
  detailUpdated: document.querySelector("#detail-updated"),
  detailExtra: document.querySelector("#detail-extra"),
};

const requiredElements = Object.entries(elements).filter(([, element]) => element === null);
if (requiredElements.length > 0) {
  throw new Error(`Faltan elementos requeridos: ${requiredElements.map(([name]) => name).join(", ")}`);
}

const nodes = [...document.querySelectorAll(".flow-node[data-agent]")];
let latestData = null;
let selectedId = "orchestrator";
let lastReadAt = null;
let previousSnapshot = null;
let requestInProgress = false;
let demoMode = false;
let demoStatus = null;
let demoStepIndex = -1;
let refreshTimer = null;

function setText(element, value) {
  if (element.textContent !== value) {
    element.textContent = value;
  }
}

function getStage(data, id) {
  if (id === "issue") {
    return data?.issue ? { status: "completed", message: "", updatedAt: data.updatedAt } : null;
  }
  if (id === "plan") {
    return data?.agents.planner ?? null;
  }
  if (id === "release") {
    return data?.release ?? null;
  }
  return data?.agents[id] ?? null;
}

function updateConnection(state, message) {
  elements.connection.dataset.state = state;
  setText(elements.connectionLabel, message);
}

function updateProgress(data) {
  const stages = [...Object.values(data.agents), data.release];
  const completed = stages.filter((stage) => stage.status === "completed").length;
  setText(elements.progressLabel, `${completed} de ${stages.length}`);
  elements.progressTrack.setAttribute("aria-valuenow", String(completed));
  elements.progressFill.style.width = `${(completed / stages.length) * 100}%`;
}

function updateNode(node, data) {
  const id = node.dataset.agent;
  const stage = getStage(data, id);
  const status = stage?.status ?? "unknown";
  const label = statusLabels[status];
  node.dataset.status = status;
  node.setAttribute("aria-label", `${titles[id]}, ${label.toLocaleLowerCase("es-ES")}`);
  const statusElement = node.querySelector(".flow-node__status");
  setText(statusElement, label);
}

function updateIssue(data) {
  if (!data.issue) {
    setText(elements.issueHeading, "Esperando el primer issue");
    setText(elements.issueDescription, "El orquestador publicará aquí el issue cuando inicie el flujo.");
    elements.issueLink.hidden = true;
    elements.issueLink.removeAttribute("href");
    return;
  }

  setText(elements.issueHeading, `#${data.issue.id} · ${data.issue.title}`);
  setText(elements.issueDescription, `Último cambio publicado: ${formatWorkflowTimestamp(data.updatedAt)}.`);
  if (data.issue.url) {
    elements.issueLink.href = data.issue.url;
    elements.issueLink.hidden = false;
  } else {
    elements.issueLink.hidden = true;
    elements.issueLink.removeAttribute("href");
  }
}

function updateDetail() {
  const stage = getStage(latestData, selectedId);
  const status = stage?.status ?? "unknown";
  elements.detailStatus.dataset.status = status;
  setText(elements.detailHeading, titles[selectedId]);
  setText(elements.detailStatus, statusLabels[status]);
  setText(elements.detailDescription, descriptions[selectedId]);

  const message = stage?.message?.trim() ?? "";
  elements.detailMessage.hidden = message.length === 0;
  setText(elements.detailMessage, message);

  const updatedAt = stage?.updatedAt ?? (selectedId === "issue" ? latestData?.updatedAt : null);
  setText(elements.detailUpdated, `Última actividad: ${formatWorkflowTimestamp(updatedAt)}`);
  let extra = "";
  if (selectedId === "developer" && stage?.cycle) {
    extra = `Ciclo ${stage.cycle} de 3`;
  } else if (selectedId === "plan" && stage?.artifact) {
    extra = stage.artifact;
  }
  setText(elements.detailExtra, extra);
}

function render(data) {
  latestData = data;
  updateIssue(data);
  updateProgress(data);
  nodes.forEach((node) => updateNode(node, data));
  updateDetail();
}

function showUnavailableState() {
  nodes.forEach((node) => {
    node.dataset.status = "unknown";
    const statusElement = node.querySelector(".flow-node__status");
    setText(statusElement, statusLabels.unknown);
    node.setAttribute("aria-label", `${titles[node.dataset.agent]}, sin datos`);
  });
  elements.progressTrack.setAttribute("aria-valuenow", "0");
  elements.progressFill.style.width = "0%";
  setText(elements.progressLabel, "—");
  setText(elements.issueHeading, "Estado no disponible");
  setText(elements.issueDescription, "Comprueba que workflow-status.json exista y se sirva desde el workspace.");
  elements.issueLink.hidden = true;
  elements.issueLink.removeAttribute("href");
  updateDetail();
}

function selectNode(id) {
  if (!titles[id]) {
    return;
  }
  selectedId = id;
  nodes.forEach((node) => {
    const selected = node.dataset.agent === id;
    node.classList.toggle("is-selected", selected);
    node.setAttribute("aria-pressed", String(selected));
  });
  updateDetail();
}

async function refresh() {
  if (requestInProgress || demoMode) {
    return;
  }
  requestInProgress = true;
  elements.refreshButton.disabled = true;

  try {
    const data = await fetchWorkflowStatus();
    if (demoMode) {
      return;
    }
    const snapshot = JSON.stringify(data);
    render(data);
    lastReadAt = new Date();
    updateConnection("connected", `Actualizado ${new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(lastReadAt)}`);
    elements.feedMessage.hidden = true;
    setText(elements.feedMessage, "");
    if (previousSnapshot !== null && previousSnapshot !== snapshot) {
      elements.feedMessage.hidden = false;
      setText(elements.feedMessage, "El estado publicado por los agentes ha cambiado.");
    }
    previousSnapshot = snapshot;
  } catch (error) {
    updateConnection("error", "Sin conexión al archivo");
    elements.feedMessage.hidden = false;
    const staleNote = lastReadAt
      ? ` Se conserva la última lectura (${new Intl.DateTimeFormat("es-ES", { timeStyle: "short" }).format(lastReadAt)}).`
      : "";
    setText(elements.feedMessage, `${error.message}${staleNote}`);
    if (!latestData) {
      showUnavailableState();
    }
  } finally {
    requestInProgress = false;
    elements.refreshButton.disabled = false;
  }
}

function applyDemoStep() {
  const step = demoSteps[demoStepIndex];
  demoStatus = advanceDemoWorkflow(demoStatus, demoStepIndex);
  render(demoStatus);
  selectNode(step.agent === "release" ? "release" : step.agent);
  updateConnection("connected", "Modo demo");
  elements.demoBadge.hidden = false;
  elements.feedMessage.hidden = false;
  setText(elements.feedMessage, `DEMO · Paso ${demoStepIndex + 1} de ${demoSteps.length}: ${step.label}. ${step.message} No se ha modificado el archivo real ni se ha publicado nada.`);
  setText(elements.demoNext, demoStepIndex === demoSteps.length - 1 ? "Reiniciar demo" : "Siguiente paso");
}

function toggleDemo() {
  if (demoMode) {
    demoMode = false;
    demoStatus = null;
    demoStepIndex = -1;
    elements.demoBadge.hidden = true;
    elements.demoNext.hidden = true;
    setText(elements.demoToggle, "Probar modo demo");
    elements.feedMessage.hidden = true;
    selectNode("orchestrator");
    void refresh();
    return;
  }

  demoMode = true;
  window.clearInterval(refreshTimer);
  demoStatus = createDemoWorkflowStatus();
  demoStepIndex = 0;
  elements.demoNext.hidden = false;
  setText(elements.demoToggle, "Volver al estado real");
  applyDemoStep();
}

function advanceDemo() {
  if (!demoMode) {
    return;
  }
  if (demoStepIndex === demoSteps.length - 1) {
    demoStatus = createDemoWorkflowStatus();
    demoStepIndex = 0;
  } else {
    demoStepIndex += 1;
  }
  applyDemoStep();
}

nodes.forEach((node) => {
  node.addEventListener("click", () => selectNode(node.dataset.agent));
  node.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNode(node.dataset.agent);
    }
  });
});

elements.refreshButton.addEventListener("click", refresh);
elements.demoToggle.addEventListener("click", toggleDemo);
elements.demoNext.addEventListener("click", advanceDemo);
selectNode(selectedId);
void refresh();
refreshTimer = window.setInterval(() => void refresh(), 5000);
