import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const url = new URL(req.url);
  const tag = url.searchParams.get("tag") ?? "manual";
  log.warn("debug.throw.invoked", { tag, path: url.pathname });
  throw new Error(`Deliberate telemetry test error (tag=${tag})`);
}
