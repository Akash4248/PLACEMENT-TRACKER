const isDevelopment = import.meta.env.DEV;

const write = (level, message, meta) => {
  const payload = meta ? [message, meta] : [message];

  if (isDevelopment || level === "error" || level === "warn") {
    console[level === "debug" ? "log" : level](
      `[CampusTrack:${level}]`,
      ...payload
    );
  }
};

const logger = {
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
  debug: (message, meta) => write("debug", message, meta),
};

export default logger;
