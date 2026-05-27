export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (reason) => {
      emit("error", "process.unhandledRejection", serialize(reason));
    });
    process.on("uncaughtException", (err) => {
      emit("error", "process.uncaughtException", serialize(err));
    });
  }
}

export const onRequestError: (
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource?: string;
    revalidateReason?: string;
    renderType?: string;
  },
) => void = (err, request, context) => {
  const h = request.headers["x-request-id"];
  const requestId = Array.isArray(h) ? h[0] : h;
  emit("error", "next.onRequestError", {
    requestId,
    method: request.method,
    path: request.path,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    ...serialize(err),
  });
};

function emit(level: "info" | "warn" | "error", msg: string, fields: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function serialize(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack,
    };
  }
  return { errorMessage: String(err) };
}
