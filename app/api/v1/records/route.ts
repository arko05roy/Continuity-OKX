import { ensureSchema,listContinuityRecords } from "../../../../src/db";
export async function GET(){await ensureSchema();return Response.json({records:await listContinuityRecords(200)});}
