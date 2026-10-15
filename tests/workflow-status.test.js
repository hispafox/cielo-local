import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  fetchWorkflowStatus,
  formatWorkflowTimestamp,
  statusLabels,
  validateWorkflowStatus,
} from "../src/workflow-status.js";
import { advanceDemoWorkflow, createDemoWorkflowStatus, demoSteps } from "../src/workflow-demo.js";

const initialStatus = JSON.parse(await readFile(new URL("../workflow-status.json", import.meta.url), "utf8"));

test("accepts the empty workflow status file", () => {
  assert.deepEqual(validateWorkflowStatus(initialStatus), initialStatus);
});

test("validates active issue and agent activity", () => {
  const status = structuredClone(initialStatus);
  status.issue = { id: 42, title: "Añadir visualización", url: "https://github.com/example/repo/issues/42" };
  status.updatedAt = "2026-10-15T11:00:00.000Z";
  status.agents.developer = {
    status: "active",
    message: "Implementando el ciclo de revisión.",
    updatedAt: "2026-10-15T11:00:00.000Z",
    cycle: 2,
  };
  assert.equal(validateWorkflowStatus(status), status);
});

test("rejects unsupported agent states and cycles", () => {
  const status = structuredClone(initialStatus);
  status.agents.planner.status = "in_progress";
  assert.throws(() => validateWorkflowStatus(status), /waiting, active, completed o blocked/);

  status.agents.planner.status = "active";
  status.agents.developer.cycle = 4;
  assert.throws(() => validateWorkflowStatus(status), /número del 1 al 3/);
});

test("rejects unsafe issue links and incomplete issue details", () => {
  const status = structuredClone(initialStatus);
  status.issue = { id: 1, title: "Issue", url: "javascript:alert(1)" };
  assert.throws(() => validateWorkflowStatus(status), /URL HTTP o HTTPS/);

  status.issue = { id: 1, title: "" };
  assert.throws(() => validateWorkflowStatus(status), /issue.title/);
});

test("fetches JSON without cache and reports unsuccessful responses", async () => {
  let requestOptions;
  const validFetch = async (_url, options) => {
    requestOptions = options;
    return { ok: true, json: async () => initialStatus };
  };
  assert.deepEqual(await fetchWorkflowStatus(validFetch), initialStatus);
  assert.equal(requestOptions.cache, "no-store");

  await assert.rejects(
    fetchWorkflowStatus(async () => ({ ok: false, status: 503 })),
    /HTTP 503/,
  );
});

test("reports invalid JSON and formats timestamps in Spanish", async () => {
  await assert.rejects(
    fetchWorkflowStatus(async () => ({ ok: true, json: async () => { throw new SyntaxError("invalid"); } })),
    /JSON válido/,
  );
  assert.equal(statusLabels.active, "En curso");
  assert.equal(formatWorkflowTimestamp(null), "sin actividad registrada");
  assert.match(formatWorkflowTimestamp("2026-10-15T11:00:00.000Z"), /2026/);
});

test("simulates the full agent flow without changing its input state", () => {
  let status = createDemoWorkflowStatus();
  assert.equal(status.issue.id, 42);
  assert.equal(status.agents.orchestrator.status, "waiting");

  for (let index = 0; index < demoSteps.length; index += 1) {
    status = advanceDemoWorkflow(status, index, `2026-10-15T11:${String(index).padStart(2, "0")}:00.000Z`);
    assert.equal(validateWorkflowStatus(status), status);
  }

  assert.equal(status.agents.orchestrator.status, "completed");
  assert.equal(status.agents.planner.artifact, "docs/planificacion-issue-42.md");
  assert.equal(status.agents.developer.cycle, 2);
  assert.equal(status.agents.verifier.status, "completed");
  assert.equal(status.release.status, "completed");
  assert.equal(createDemoWorkflowStatus().agents.orchestrator.status, "waiting");
});
