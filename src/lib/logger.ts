type Level = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function emit(level: Level, msg: string, fields?: LogFields) {
  const record = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  };
  const line = JSON.stringify(record);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else if (level === "debug") {
    console.debug(line);
  } else {
    console.log(line);
  }
}

export const log = {
  debug: (msg: string, fields?: LogFields) => emit("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => emit("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => emit("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => emit("error", msg, fields),
};

export function serializeError(err: unknown): LogFields {
  if (err instanceof Error) {
    return {
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack,
    };
  }
  return { errorMessage: String(err) };
}
