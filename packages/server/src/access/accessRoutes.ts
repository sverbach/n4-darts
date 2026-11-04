// Logging in to /admin with the PIN (a cookie holds the token) and the guard in front of every
// other /api/admin/* route.

import type { FastifyInstance } from "fastify";
import { type AdminSession, PinInput, type PublicSession } from "../api.ts";
import { parse } from "../parse.ts";
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

const cookie = (name: string, value: string, maxAge: number, secure = false) =>
  `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
const setCookie = (value: string, maxAge: number) => cookie(COOKIE, value, maxAge);

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

  app.post("/api/admin/login", async (request, reply) => {
    const { pin } = parse(PinInput, request.body);
    if (!access.token) return reply.code(204).send();
    if (!access.isPin(pin)) {
      return reply.code(401).send({ error: "wrong PIN" });
    }
    return reply.header("set-cookie", setCookie(access.token, MAX_AGE)).code(204).send();
  });

  app.post("/api/admin/logout", async (_request, reply) =>
    reply.header("set-cookie", setCookie("", 0)).code(204).send(),
  );
}

const PUBLIC_COOKIE = "n4_public";
/** Routes of the public site that work without logging in. */
const PUBLIC_OPEN = new Set([
  "/api/health",
  "/api/public/login",
  "/api/public/logout",
  "/api/public/session",
]);
/** How long a wrong PIN waits before its answer. */
const WRONG_PIN_DELAY_MS = 1000;

/**
 * The public site's shared PIN (docs/adr/0008): login/logout/session, and a guard in front of
 * every other /api route. The cookie is Secure when nginx says the request came over TLS.
 */
export function registerPublicAccess(
  app: FastifyInstance,
  access: Access,
  options: { wrongPinDelayMs?: number | undefined } = {},
) {
  const authenticated = (cookies: string | undefined) =>
    access.allows(cookieValue(cookies, PUBLIC_COOKIE));

  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0] as string;
    if (!path.startsWith("/api/") || PUBLIC_OPEN.has(path)) return;
    if (!authenticated(request.headers.cookie)) {
      return reply.code(401).send({ error: "password required" });
    }
  });

  app.get(
    "/api/public/session",
    async (request): Promise<PublicSession> => ({
      public: true,
      authenticated: authenticated(request.headers.cookie),
    }),
  );

  app.post("/api/public/login", async (request, reply) => {
    const { pin } = parse(PinInput, request.body);
    if (!access.token || !access.isPin(pin)) {
      await new Promise((resolve) =>
        setTimeout(resolve, options.wrongPinDelayMs ?? WRONG_PIN_DELAY_MS),
      );
      return reply.code(401).send({ error: "wrong password" });
    }
    const secure = request.headers["x-forwarded-proto"] === "https";
    return reply
      .header("set-cookie", cookie(PUBLIC_COOKIE, access.token, MAX_AGE, secure))
      .code(204)
      .send();
  });

  app.post("/api/public/logout", async (_request, reply) =>
    reply
      .header("set-cookie", cookie(PUBLIC_COOKIE, "", 0))
      .code(204)
      .send(),
  );
}

/** On the room's server: not the public site, and nothing to log in to. */
export function registerRoomSession(app: FastifyInstance) {
  app.get(
    "/api/public/session",
    async (): Promise<PublicSession> => ({ public: false, authenticated: true }),
  );
}
