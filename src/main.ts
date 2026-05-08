import "dotenv/config";
import { bootstrap } from "./bootstrap.js";
import { logger } from "./logger.js";

bootstrap().catch((e) => {
  logger.error({ err: e }, "fatal startup error");
  process.exit(1);
});
