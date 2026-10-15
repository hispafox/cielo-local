export const demoSteps = Object.freeze([
  {
    agent: "orchestrator",
    status: "active",
    message: "Issue recibido. Repartiendo el trabajo y conservando la ruta del plan.",
    label: "El orquestador recibe el issue",
  },
  {
    agent: "planner",
    status: "active",
    message: "Analizando criterios y alcance antes de proponer cambios.",
    label: "Empieza la planificación",
  },
  {
    agent: "planner",
    status: "completed",
    message: "Plan creado y ruta compartida con el orquestador.",
    artifact: "docs/planificacion-issue-42.md",
    label: "El plan queda listo",
  },
  {
    agent: "developer",
    status: "active",
    message: "Implementando el plan y ejecutando las pruebas del primer ciclo.",
    cycle: 1,
    label: "Desarrollo · ciclo 1",
  },
  {
    agent: "developer",
    status: "completed",
    message: "Implementación y pruebas del primer ciclo terminadas.",
    cycle: 1,
    label: "El desarrollador entrega",
  },
  {
    agent: "verifier",
    status: "active",
    message: "Contrastando implementación y pruebas con los criterios del plan.",
    label: "Empieza la verificación",
  },
  {
    agent: "verifier",
    status: "completed",
    message: "Hay un hallazgo: falta cubrir un caso límite. Se solicita una corrección.",
    label: "El verificador solicita una corrección",
  },
  {
    agent: "developer",
    status: "active",
    message: "Corrigiendo el caso límite señalado por el verificador.",
    cycle: 2,
    label: "Desarrollo · ciclo 2",
  },
  {
    agent: "developer",
    status: "completed",
    message: "Corrección aplicada y comprobaciones repetidas.",
    cycle: 2,
    label: "Corrección entregada",
  },
  {
    agent: "verifier",
    status: "active",
    message: "Verificando la corrección en el segundo ciclo.",
    label: "Segunda verificación",
  },
  {
    agent: "verifier",
    status: "completed",
    message: "Aprobado: los criterios y las comprobaciones requeridas se cumplen.",
    label: "El verificador aprueba",
  },
  {
    agent: "release",
    status: "active",
    message: "Iniciando versionado y preparación de la publicación tras la aprobación.",
    label: "Empieza el cierre",
  },
  {
    agent: "release",
    status: "completed",
    message: "Demo: versionado, commit y PR representados como completados; no se ha creado ninguno.",
    label: "Cierre simulado",
  },
  {
    agent: "orchestrator",
    status: "completed",
    message: "Flujo de demostración finalizado después de la aprobación.",
    label: "Flujo terminado",
  },
]);

export function createDemoWorkflowStatus() {
  const emptyStage = () => ({ status: "waiting", message: "", updatedAt: null });
  return {
    issue: {
      id: 42,
      title: "Añadir búsqueda de ciudades favoritas",
    },
    updatedAt: null,
    agents: {
      orchestrator: emptyStage(),
      planner: emptyStage(),
      developer: emptyStage(),
      verifier: emptyStage(),
    },
    release: emptyStage(),
  };
}

export function advanceDemoWorkflow(status, stepIndex, updatedAt = new Date().toISOString()) {
  const step = demoSteps[stepIndex];
  if (!step) {
    throw new RangeError("El paso de demostración no existe.");
  }
  if (!Number.isFinite(Date.parse(updatedAt))) {
    throw new TypeError("La fecha de la demostración debe ser válida.");
  }

  const stage = {
    ...status[step.agent === "release" ? "release" : "agents"][step.agent],
    status: step.status,
    message: step.message,
    updatedAt,
  };
  if (step.cycle !== undefined) {
    stage.cycle = step.cycle;
  }
  if (step.artifact !== undefined) {
    stage.artifact = step.artifact;
  }

  if (step.agent === "release") {
    return { ...status, release: stage, updatedAt };
  }
  return {
    ...status,
    agents: { ...status.agents, [step.agent]: stage },
    updatedAt,
  };
}
