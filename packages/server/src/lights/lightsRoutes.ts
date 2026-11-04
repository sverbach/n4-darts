// Admin → Lights (behind the PIN): devices, each station's lights, and the test buttons.

import type { FastifyInstance, FastifyReply } from "fastify";
import {
  LightDeviceChangesInput,
  LightTestInput,
  NewLightDeviceInput,
  StationLightsInput,
} from "../api.ts";
import type { ChangeFeed } from "../live/live.ts";
import { streamView } from "../live/liveRoutes.ts";
import { IdParams, parse } from "../parse.ts";
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

export function registerLights(app: FastifyInstance, lights: Lights, feed?: ChangeFeed) {
  const base = "/api/admin/lights";

  app.get(base, async () => lights.view());
  if (feed) {
    app.get(`${base}/live`, (request, reply) =>
      streamView(request, reply, feed.subscribe, () => lights.view(), { kind: "admin lights" }),
    );
  }

  app.post(`${base}/devices`, async (request, reply) => {
    const input = parse(NewLightDeviceInput, request.body);
    return attempt(reply, () => reply.code(201).send(lights.addDevice(input)));
  });
  app.patch(`${base}/devices/:id`, async (request, reply) => {
    const { id } = parse(IdParams, request.params);
    const input = parse(LightDeviceChangesInput, request.body);
    return attempt(reply, () => lights.updateDevice(id, input));
  });
  app.delete(`${base}/devices/:id`, async (request, reply) => {
    const { id } = parse(IdParams, request.params);
    return attempt(reply, () => {
      lights.removeDevice(id);
      return reply.code(204).send();
    });
  });
  app.post(`${base}/devices/:id/test`, async (request, reply) => {
    const { id } = parse(IdParams, request.params);
    return attempt(reply, () => lights.testDevice(id));
  });

  app.put(`${base}/stations/:id`, async (request, reply) => {
    const { id } = parse(IdParams, request.params);
    const input = parse(StationLightsInput, request.body);
    return attempt(reply, () => lights.saveStation(id, input));
  });
  app.post(`${base}/stations/:id/test`, async (request, reply) => {
    const { id } = parse(IdParams, request.params);
    const { event } = parse(LightTestInput, request.body);
    return attempt(reply, async () => {
      await lights.testEvent(id, event);
      return reply.code(204).send();
    });
  });
}
