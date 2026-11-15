import assert from "node:assert";
import {
  ALERT_THRESHOLDS,
  calendarDaysSinceInLisbon,
  deriveAlerts,
  formatAlertDateInLisbon,
  isMoreThanDaysOld,
  type AlertProjectContext,
} from "../lib/alerts";

const now = new Date("2026-11-09T12:00:00Z");

function project(overrides: Partial<AlertProjectContext> = {}): AlertProjectContext {
  return {
    id: "project-1",
    name: "Obra de teste",
    createdAt: new Date("2026-10-01T10:00:00Z"),
    hasForeman: true,
    workerCount: 1,
    lastLogDate: new Date("2026-11-08T10:00:00Z"),
    ...overrides,
  };
}

function derive(projects: AlertProjectContext[], pendingLogs: Parameters<typeof deriveAlerts>[0]["pendingLogs"] = []) {
  return deriveAlerts({
    projects,
    pendingLogs,
    overdueTasks: [],
    usersMustChangePassword: [],
    now,
  });
}

assert.strictEqual(ALERT_THRESHOLDS.PENDING_OVERDUE_DAYS, 3);
assert.strictEqual(ALERT_THRESHOLDS.PROJECT_INACTIVE_DAYS, 7);

{
  const exactThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  assert.strictEqual(isMoreThanDaysOld(exactThreshold, 3, now), false);
  assert.strictEqual(isMoreThanDaysOld(new Date(exactThreshold.getTime() - 1), 3, now), true);

  const pendingLog = {
    project: { id: "project-1", name: "Obra de teste" },
    count: 1,
    oldestCreatedAt: exactThreshold,
  };
  assert.strictEqual(derive([], [pendingLog]).some((alert) => alert.type === "PENDING_WORK_LOGS"), false);
  assert.strictEqual(
    derive([], [{ ...pendingLog, oldestCreatedAt: new Date(exactThreshold.getTime() - 1) }])
      .some((alert) => alert.type === "PENDING_WORK_LOGS"),
    true
  );
}

{
  const lisbonNow = new Date("2026-03-31T00:15:00Z");
  const sevenLocalDaysAgo = new Date("2026-03-24T23:30:00Z");
  assert.strictEqual(calendarDaysSinceInLisbon(sevenLocalDaysAgo, lisbonNow), 7);
  assert.strictEqual(
    deriveAlerts({
      projects: [project({ lastLogDate: sevenLocalDaysAgo })],
      pendingLogs: [],
      overdueTasks: [],
      usersMustChangePassword: [],
      now: lisbonNow,
    }).some((alert) => alert.type === "PROJECT_INACTIVE"),
    true
  );
  assert.strictEqual(
    derive([project({ lastLogDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) })])
      .some((alert) => alert.type === "PROJECT_INACTIVE"),
    false
  );
  assert.strictEqual(
    derive([project({ lastLogDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) })])
      .some((alert) => alert.type === "PROJECT_INACTIVE"),
    true
  );
}

{
  assert.strictEqual(
    derive([project({ createdAt: new Date("2026-11-02T12:00:00Z"), lastLogDate: null })])
      .some((alert) => alert.type === "PROJECT_INACTIVE"),
    true
  );
  assert.strictEqual(
    derive([project({ createdAt: new Date("2026-11-03T12:00:00Z"), lastLogDate: null })])
      .some((alert) => alert.type === "PROJECT_INACTIVE"),
    false
  );
}

{
  const date = formatAlertDateInLisbon(new Date("2026-08-10T12:30:00Z"));
  assert.match(date, /13:30/);
  assert.match(formatAlertDateInLisbon(new Date("2026-11-09T12:30:00Z")), /09\/11\/26, 12:30/);
}

{
  const alerts = deriveAlerts({
    projects: [project({ hasForeman: false })],
    pendingLogs: [{
      project: { id: "project-1", name: "Obra de teste" },
      count: 1,
      oldestCreatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    }],
    overdueTasks: [{
      id: "task-1",
      title: "Encomendar material",
      dueDate: new Date("2026-11-01T12:00:00Z"),
      project: null,
    }],
    usersMustChangePassword: [{
      id: "user-1",
      name: "Ana",
      updatedAt: new Date("2026-11-02T12:00:00Z"),
    }],
    now,
  });
  assert.strictEqual(alerts[0].severity, "CRITICAL");
  assert.strictEqual(alerts.find((alert) => alert.type === "OVERDUE_TASK")?.project, null);
  assert.strictEqual(alerts.every((alert) => alert.date instanceof Date && alert.action.href.length > 0), true);

  const informationalAlerts = derive([
    project({ workerCount: 0 }),
  ]);
  assert.strictEqual(informationalAlerts.some((alert) => alert.type === "PROJECT_NO_WORKERS"), true);

  const passwordAlerts = deriveAlerts({
    projects: [],
    pendingLogs: [],
    overdueTasks: [],
    usersMustChangePassword: [{
      id: "user-2",
      name: "Rui",
      updatedAt: new Date("2026-11-02T12:00:00Z"),
    }],
    now,
  });
  assert.strictEqual(passwordAlerts[0].type, "USER_MUST_CHANGE_PASSWORD");
  assert.strictEqual(passwordAlerts[0].severity, "INFO");

  const taskDueToday = deriveAlerts({
    projects: [],
    pendingLogs: [],
    overdueTasks: [{
      id: "task-today",
      title: "Tarefa para hoje",
      dueDate: new Date("2026-11-09T00:00:00Z"),
      project: null,
    }],
    usersMustChangePassword: [],
    now,
  });
  assert.strictEqual(taskDueToday.some((alert) => alert.type === "OVERDUE_TASK"), false);
}

console.log("✔ Alertas: fronteiras de 3/7 dias, ausência de registos, Europe/Lisbon e regras verificadas.");
