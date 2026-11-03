// Admin → Lights (behind the PIN): devices, each station's lights, and the test buttons.

import type { FastifyInstance, FastifyReply } from "fastify";
import type { ChangeFeed } from "../live/live.ts";
import { streamView } from "../live/liveRoutes.ts";
import { type Lights, LightsError } from "./lights.ts";

const STATUS = { invalid: 400, missing: 404, unreachable: 502 } as const;

async function attempt<T>(reply: FastifyReply, run: () => T | Promise<T>) {
  try {
    return await run();
  } catch (error) {
    if (error instanceof LightsError) {
      return reply.code(STATUS[error.reason]).send({ error: error.message });
    }
    throw error;
  }
}

type Body = Record<string, unknown> | undefined;

export function registerLights(app: FastifyInstance, lights: Lights, feed?: ChangeFeed) {
  const base = "/api/admin/lights";

  app.get(base, async () => lights.view());
  if (feed) {
    app.get(`${base}/live`, (request, reply) =>
      streamView(request, reply, feed.subscribe, () => lights.view(), { kind: "admin lights" }),
    );
  }

  app.post<{ Body: Body }>(`${base}/devices`, async (request, reply) =>
    attempt(reply, () => reply.code(201).send(lights.addDevice(request.body ?? {}))),
  );
  app.patch<{ Params: { id: string }; Body: Body }>(`${base}/devices/:id`, async (request, reply) =>
    attempt(reply, () => lights.updateDevice(Number(request.params.id), request.body ?? {})),
  );
  app.delete<{ Params: { id: string } }>(`${base}/devices/:id`, async (request, reply) =>
    attempt(reply, () => {
      lights.removeDevice(Number(request.params.id));
      return reply.code(204).send();
    }),
  );
  app.post<{ Params: { id: string } }>(`${base}/devices/:id/test`, async (request, reply) =>
    attempt(reply, () => lights.testDevice(Number(request.params.id))),
  );

  app.put<{ Params: { id: string }; Body: Body }>(`${base}/stations/:id`, async (request, reply) =>
    attempt(reply, () => lights.saveStation(Number(request.params.id), request.body ?? {})),
  );
  app.post<{ Params: { id: string }; Body: Body }>(
    `${base}/stations/:id/test`,
    async (request, reply) =>
      attempt(reply, async () => {
        await lights.testEvent(Number(request.params.id), request.body?.event);
        return reply.code(204).send();
      }),
  );
}
