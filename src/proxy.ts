import { NextResponse, type NextRequest } from "next/server";

const REQUEST_ID_HEADER = "x-request-id";

function emit(level: "info" | "warn" | "error", msg: string, fields: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields });
  if (level === "info") {
    console.log(line);
  } else {
    console.error(line);
  }
}

export function proxy(req: NextRequest) {
  const start = Date.now();
  const requestId = req.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
  const url = new URL(req.url);

  emit("info", "http.request", {
    requestId,
    method: req.method,
    path: url.pathname,
    query: url.search || undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
    referer: req.headers.get("referer") ?? undefined,
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      undefined,
  });

  const res = NextResponse.next({ request: { headers: req.headers } });
  res.headers.set(REQUEST_ID_HEADER, requestId);

  emit("info", "http.response", {
    requestId,
    method: req.method,
    path: url.pathname,
    status: res.status,
    durationMs: Date.now() - start,
  });

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
