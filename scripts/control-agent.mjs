const state = process.argv[2];
const allowed = new Set(["HEALTHY", "FAILED", "RECOVERING"]);
if (!allowed.has(state)) throw new Error("State must be HEALTHY, FAILED, or RECOVERING");

const baseUrl = (process.env.CONTINUITY_URL || process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const token = process.env.DEMO_CONTROL_TOKEN;
if (!token) throw new Error("DEMO_CONTROL_TOKEN is required");

const response = await fetch(`${baseUrl}/api/internal/agent-control`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ state }) });
const body = await response.json();
if (!response.ok) throw new Error(body.error || `Control request failed with HTTP ${response.status}`);
console.log(`Research Coordinator is now ${body.state} (${body.updatedAt})`);
