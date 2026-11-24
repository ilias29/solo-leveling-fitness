function metricText(metric, format) {
  switch (metric?.status) {
    case "ready": return format(metric.value);
    case "missing": return "Δεν υπάρχουν καταχωρίσεις";
    case "denied": return "Χρειάζεται άδεια";
    default: return "Προσωρινά μη διαθέσιμο";
  }
}

export function initHealthConnect() {
  const cap = window.Capacitor;
  if (cap?.getPlatform?.() !== "android" || !cap.isPluginAvailable?.("HealthMetrics")) return;

  const panel = document.getElementById("healthPanel");
  const steps = document.getElementById("healthSteps");
  const sleep = document.getElementById("healthSleep");
  const access = document.getElementById("healthAccess");
  const metrics = document.getElementById("healthMetrics");
  const status = document.getElementById("healthStatus");
  let pending = false;

  async function update(action) {
    if (pending) return;
    pending = true;
    access.disabled = true;
    try {
      const result = await cap.nativePromise("HealthMetrics", action, {});
      panel.hidden = !result.available;
      if (!result.available) return;

      steps.textContent = metricText(result.steps, value => new Intl.NumberFormat("el-GR").format(value));
      sleep.textContent = metricText(result.sleep, value => `${Math.floor(value / 60)} ω ${value % 60} λ`);
      const states = [result.steps?.status, result.sleep?.status];
      metrics.hidden = states.every(state => state === "denied");
      access.hidden = states.every(state => state !== "denied");
      status.textContent = access.hidden ? "" : "Επίτρεψε την ανάγνωση βημάτων ή ύπνου στο Health Connect.";
    } catch {
      panel.hidden = false;
      metrics.hidden = true;
      access.hidden = false;
      status.textContent = "Το Health Connect δεν απάντησε. Δοκίμασε ξανά.";
    } finally {
      access.disabled = false;
      pending = false;
    }
  }

  access.addEventListener("click", () => update("connect"));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") update("readSummary");
  });
  update("readSummary");
}
