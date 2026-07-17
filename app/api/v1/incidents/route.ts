import { ensureSchema,listIncidents } from "../../../../src/db";
export async function GET(){await ensureSchema();return Response.json({incidents:await listIncidents(200)});}
