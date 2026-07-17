const baseUrl = (process.env.CONTINUITY_URL || process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.CRON_SECRET;
const intervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS || "15000");

if (!secret) throw new Error("CRON_SECRET is required");
if (!Number.isFinite(intervalMs) || intervalMs < 5000) throw new Error("WORKER_POLL_INTERVAL_MS must be at least 5000");

let stopping = false;
let running = false;

const timestamp = () => new Date().toISOString();

async function tick() {
  if (running || stopping) return;
  running = true;
  try {
    const response = await fetch(`${baseUrl}/api/cron/monitor`, {
      headers: { authorization: `Bearer ${secret}` },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
    console.log(`[${timestamp()}] checked=${body.checked} succeeded=${body.succeeded} failed=${body.failed}`);
  } catch (error) {
    console.error(`[${timestamp()}] worker error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    running = false;
  }
}

function stop(signal) {
  stopping = true;
  clearInterval(timer);
  console.log(`[${timestamp()}] stopping after ${signal}`);
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

console.log(`[${timestamp()}] Continuity worker watching ${baseUrl} every ${intervalMs}ms`);
await tick();
const timer = setInterval(() => void tick(), intervalMs);
