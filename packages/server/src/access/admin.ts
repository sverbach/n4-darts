// /admin is protected by a shared PIN from server config (docs/adr/0004): enough to stop a
// guest from editing by accident, not meant to stop an attacker. The routes, the cookie and the
// guard in front of /api/admin are in accessRoutes.ts.

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The token a logged-in device keeps: derived from the PIN alone, so a device stays logged in
 * across server restarts and is logged out when the PIN changes.
 */
const tokenFor = (pin: string) => createHmac("sha256", pin).update("n4-darts admin").digest("hex");

function sameText(a: string, b: string) {
  const [x, y] = [Buffer.from(a), Buffer.from(b)];
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Without a PIN, /admin is open. */
export function createAccess(pin: string | undefined) {
  const token = pin ? tokenFor(pin) : undefined;
  return {
    /** The token for a correct PIN; undefined while /admin is open. */
    token,
    /** Whether a device holding `value` may use /admin. */
    allows: (value: string | undefined) =>
      !token || (value !== undefined && sameText(value, token)),
    /** Whether `attempt` is the PIN. */
    isPin: (attempt: string) => pin !== undefined && sameText(attempt, pin),
  };
}

export type Access = ReturnType<typeof createAccess>;
