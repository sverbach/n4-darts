// /admin is protected by a shared PIN from server config (docs/adr/0004): enough to stop a
// guest from editing by accident, not meant to stop an attacker.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { AdminSession } from "../api.ts";

const COOKIE = "n4_admin";
const MAX_AGE = 30 * 24 * 60 * 60;

/** Routes under the prefix that work without logging in. */
const OPEN = new Set(["/api/admin/login", "/api/admin/logout", "/api/admin/session"]);

/**
 * The cookie value: derived from the PIN alone, so a device stays logged in across server
 * restarts and is logged out when the PIN changes.
 */
const tokenFor = (pin: string) => createHmac("sha256", pin).update("n4-darts admin").digest("hex");

function sameText(a: string, b: string) {
  const [x, y] = [Buffer.from(a), Buffer.from(b)];
  return x.length === y.length && timingSafeEqual(x, y);
}

function cookieValue(header: string | undefined, name: string) {
  for (const part of header?.split(";") ?? []) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

/** Adds login/logout/session routes and guards every other `/api/admin/*` route. */
export function registerAdmin(app: FastifyInstance, pin: string | undefined) {
  const token = pin ? tokenFor(pin) : undefined;
  const authenticated = (cookies: string | undefined) => {
    if (!token) return true;
    const value = cookieValue(cookies, COOKIE);
    return value !== undefined && sameText(value, token);
  };
  const setCookie = (value: string, maxAge: number) =>
    `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;

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
      pinRequired: token !== undefined,
      authenticated: authenticated(request.headers.cookie),
    }),
  );

  app.post<{ Body: { pin?: unknown } }>("/api/admin/login", async (request, reply) => {
    if (!pin || !token) return reply.code(204).send();
    if (!sameText(String(request.body?.pin ?? ""), pin)) {
      return reply.code(401).send({ error: "wrong PIN" });
    }
    return reply.header("set-cookie", setCookie(token, MAX_AGE)).code(204).send();
  });

  app.post("/api/admin/logout", async (_request, reply) =>
    reply.header("set-cookie", setCookie("", 0)).code(204).send(),
  );
}
