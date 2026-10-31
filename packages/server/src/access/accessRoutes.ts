// Logging in to /admin with the PIN (a cookie holds the token) and the guard in front of every
// other /api/admin/* route.

import type { FastifyInstance } from "fastify";
import type { AdminSession } from "../api.ts";
import type { Access } from "./admin.ts";

const COOKIE = "n4_admin";
const MAX_AGE = 30 * 24 * 60 * 60;

/** Routes under the prefix that work without logging in. */
const OPEN = new Set(["/api/admin/login", "/api/admin/logout", "/api/admin/session"]);

function cookieValue(header: string | undefined, name: string) {
  for (const part of header?.split(";") ?? []) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

const setCookie = (value: string, maxAge: number) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;

/** Adds login/logout/session routes and guards every other `/api/admin/*` route. */
export function registerAdmin(app: FastifyInstance, access: Access) {
  const authenticated = (cookies: string | undefined) =>
    access.allows(cookieValue(cookies, COOKIE));

  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0] as string;
    if (!path.startsWith("/api/admin/") || OPEN.has(path)) return;
    if (!authenticated(request.headers.cookie)) {
      return reply.code(401).send({ error: "admin PIN required" });
    }
  });

  app.get(
    "/api/admin/session",
    async (request): Promise<AdminSession> => ({
      pinRequired: access.token !== undefined,
      authenticated: authenticated(request.headers.cookie),
    }),
  );

  app.post<{ Body: { pin?: unknown } }>("/api/admin/login", async (request, reply) => {
    if (!access.token) return reply.code(204).send();
    if (!access.isPin(String(request.body?.pin ?? ""))) {
      return reply.code(401).send({ error: "wrong PIN" });
    }
    return reply.header("set-cookie", setCookie(access.token, MAX_AGE)).code(204).send();
  });

  app.post("/api/admin/logout", async (_request, reply) =>
    reply.header("set-cookie", setCookie("", 0)).code(204).send(),
  );
}
