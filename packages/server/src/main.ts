import { fileURLToPath } from "node:url";
import { buildApp } from "./app.ts";

const port = Number(process.env.PORT ?? 3000);
const webDir = process.env.WEB_DIR ?? fileURLToPath(new URL("../../web/dist", import.meta.url));

const app = buildApp({ webDir });
app.log.info(`serving web app from ${webDir}`);
await app.listen({ host: "0.0.0.0", port });
console.log(`n4-darts listening on http://0.0.0.0:${port}`);
