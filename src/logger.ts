import pino, { type LoggerOptions } from "pino";

const isPrettyLogs = process.env.LOG_PRETTY !== "0";

export const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "debug",
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isPrettyLogs
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: false,
          translateTime: "yyyy-mm-dd HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      }
    : undefined,
};

export const logger = pino(loggerOptions);
